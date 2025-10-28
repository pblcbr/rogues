"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";

interface RunMeasurementProps {
  workspaceId: string;
}

export function RunMeasurement({ workspaceId }: RunMeasurementProps) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("");

  const handleRun = async () => {
    if (!workspaceId) return;
    setIsRunning(true);
    setMessage("");
    try {
      const res = await fetch("/api/measure/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setMessage(json.error || json.reason || "Run failed");
      } else {
        setMessage("Run started successfully");
        router.refresh();
      }
    } catch (e: any) {
      setMessage(e?.message || "Run failed");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleRun} disabled={isRunning}>
        {isRunning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" /> Run measurement
          </>
        )}
      </Button>
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
}
