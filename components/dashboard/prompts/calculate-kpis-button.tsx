"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Loader2, BarChart3 } from "lucide-react";

interface CalculateKPIsButtonProps {
  workspaceId: string;
  regionId?: string | null;
}

interface ProgressState {
  total: number;
  current: number;
  processed: number;
  skipped: number;
  errors: number;
  currentPrompt?: {
    id: string;
    text: string;
  };
  logs: Array<{
    type: "success" | "error" | "skipped";
    promptText: string;
    message?: string;
    kpis?: {
      visibilityScore: number;
      mentionRate: number;
      citationRate: number;
      avgPosition: string;
    };
  }>;
}

/**
 * Calculate KPIs Button Component with Real-time Progress
 * Uses Server-Sent Events (SSE) to show live progress of KPI calculations
 */
export function CalculateKPIsButton({
  workspaceId,
  regionId,
}: CalculateKPIsButtonProps) {
  const router = useRouter();
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [forceRecalculate, setForceRecalculate] = useState(false);

  const handleCalculate = async () => {
    console.log("[Calculate KPIs] Starting calculation");

    if (!workspaceId) {
      setError("No workspace ID available");
      return;
    }

    setIsCalculating(true);
    setProgress(null);
    setError("");

    try {
      const res = await fetch("/api/measure/daily-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          regionId: regionId || null,
          force: forceRecalculate,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Failed to start calculation");
        setIsCalculating(false);
        return;
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setError("Failed to read stream");
        setIsCalculating(false);
        return;
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("[Calculate KPIs] Stream completed");
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            console.log("[Calculate KPIs] Event:", data);

            if (data.type === "start") {
              setProgress({
                total: data.total,
                current: 0,
                processed: 0,
                skipped: 0,
                errors: 0,
                logs: [],
              });
            } else if (data.type === "progress") {
              setProgress((prev) =>
                prev
                  ? {
                      ...prev,
                      current: data.current,
                      currentPrompt: {
                        id: data.promptId,
                        text: data.promptText,
                      },
                    }
                  : null
              );
            } else if (data.type === "success") {
              setProgress((prev) =>
                prev
                  ? {
                      ...prev,
                      processed: prev.processed + 1,
                      logs: [
                        ...prev.logs,
                        {
                          type: "success",
                          promptText: data.promptText,
                          kpis: data.kpis,
                        },
                      ],
                    }
                  : null
              );
            } else if (data.type === "skipped") {
              setProgress((prev) =>
                prev
                  ? {
                      ...prev,
                      skipped: prev.skipped + 1,
                      logs: [
                        ...prev.logs,
                        {
                          type: "skipped",
                          promptText: data.promptText,
                          message: data.reason,
                        },
                      ],
                    }
                  : null
              );
            } else if (data.type === "error") {
              if (data.promptId) {
                setProgress((prev) =>
                  prev
                    ? {
                        ...prev,
                        errors: prev.errors + 1,
                        logs: [
                          ...prev.logs,
                          {
                            type: "error",
                            promptText: data.promptText,
                            message: data.error,
                          },
                        ],
                      }
                    : null
                );
              } else {
                setError(data.error);
              }
            } else if (data.type === "complete") {
              console.log("[Calculate KPIs] Complete:", data.summary);
              // Clear progress and refresh page after a short delay to show updated KPIs
              setTimeout(() => {
                setProgress(null);
                router.refresh();
              }, 1500);
            }
          }
        }
      }
    } catch (e: unknown) {
      console.error("[Calculate KPIs] Error:", e);
      setError(e instanceof Error ? e.message : "Failed to calculate KPIs");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Button
          onClick={handleCalculate}
          disabled={isCalculating || !workspaceId}
          variant="outline"
          size="sm"
        >
          {isCalculating ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <BarChart3 className="mr-2 h-3 w-3" />
              Run prompts
            </>
          )}
        </Button>

        <Tooltip
          content="By default, only prompts that haven't been run today will be executed. Enable this option to recalculate all prompts, including those already run today."
          side="top"
        >
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={forceRecalculate}
              onChange={(e) => setForceRecalculate(e.target.checked)}
              disabled={isCalculating}
              className="h-3 w-3 rounded border-gray-300"
            />
            <span>Force recalculate</span>
          </label>
        </Tooltip>

        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      {/* Compact Real-time Progress */}
      {progress && (
        <div className="space-y-1.5 rounded-md border bg-gray-50 p-2 text-xs">
          {/* Compact Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
              />
            </div>
            <span className="text-muted-foreground">
              {progress.current}/{progress.total}
            </span>
          </div>

          {/* Current Status - Inline */}
          <div className="flex items-center gap-3 text-muted-foreground">
            {progress.currentPrompt && (
              <div className="flex items-center gap-1"></div>
            )}
            {progress.processed > 0 && (
              <div className="flex items-center gap-1"></div>
            )}
            {progress.skipped > 0 && (
              <div className="flex items-center gap-1"></div>
            )}
            {progress.errors > 0 && (
              <div className="flex items-center gap-1"></div>
            )}
            {progress.logs.length > 0 && (
              <button onClick={() => setShowDetails(!showDetails)}></button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
