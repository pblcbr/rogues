"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddRegionDialog } from "./add-region-dialog";

interface WorkspaceRegion {
  id: string;
  workspace_id: string;
  region: string;
  language: string;
  is_default: boolean;
  created_at: string;
}

interface RegionSwitcherProps {
  currentWorkspaceId?: string;
  currentRegionId?: string | null;
  onSwitchToNewRegion?: (regionId: string) => void;
}

/**
 * Region Switcher Component
 * Allows users to switch between regions within a workspace
 * Shows current region and provides "All Regions" option for aggregated view
 */
export function RegionSwitcher({
  currentWorkspaceId,
  currentRegionId,
  onSwitchToNewRegion,
}: RegionSwitcherProps) {
  const router = useRouter();
  const supabase = createClient();
  const [regions, setRegions] = useState<WorkspaceRegion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isAllRegions, setIsAllRegions] = useState(!currentRegionId);

  const currentRegion = regions.find((r) => r.id === currentRegionId);

  // Fetch regions on mount or when workspace changes
  useEffect(() => {
    if (currentWorkspaceId) {
      fetchRegions();
    }
  }, [currentWorkspaceId]);

  // Update isAllRegions when regions are loaded and currentRegion is found/not found
  useEffect(() => {
    if (!isFetching && regions.length > 0) {
      // If currentRegionId is set but region not found, reset to all regions
      if (currentRegionId && !currentRegion) {
        console.warn(
          `[RegionSwitcher] Current region ID ${currentRegionId} not found in regions list`
        );
        // Don't auto-switch, just reset the UI state
      }
      // If we have a currentRegion, make sure isAllRegions is false
      if (currentRegion) {
        setIsAllRegions(false);
      }
    }
  }, [regions, currentRegionId, currentRegion, isFetching]);

  const fetchRegions = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(
        `/api/workspace-regions?workspaceId=${currentWorkspaceId}`
      );
      const data = await response.json();
      const fetchedRegions = data.regions || [];
      setRegions(fetchedRegions);
      console.log("[RegionSwitcher] Fetched regions:", fetchedRegions);
      console.log(
        "[RegionSwitcher] Current region ID:",
        currentRegionId,
        "Found region:",
        fetchedRegions.find((r: WorkspaceRegion) => r.id === currentRegionId)
      );
    } catch (error) {
      console.error("[RegionSwitcher] Error fetching regions:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSwitchRegion = async (regionId: string | null) => {
    setIsLoading(true);
    setIsOpen(false);

    try {
      if (regionId) {
        // Switch to specific region
        const response = await fetch("/api/user/switch-region", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ regionId }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to switch region");
        }

        console.log("[RegionSwitcher] Region switched successfully");
        setIsAllRegions(false);
        // Force full page reload to ensure all data updates
        window.location.reload();
      } else {
        // Show all regions (aggregated view)
        // We'll handle this by not filtering in queries
        setIsAllRegions(true);
        // Don't reload, just update UI
      }
    } catch (error) {
      console.error("Error switching region:", error);
      alert("Failed to switch region");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if no workspace ID
  if (!currentWorkspaceId) {
    return null;
  }

  if (isFetching) {
    return (
      <div className="border-b border-gray-200 px-3 py-3">
        <div className="text-xs font-medium text-gray-600">Region</div>
        <div className="mt-1 h-8 animate-pulse rounded-md bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 px-3 py-3">
      <div className="text-xs font-medium text-gray-600">Region</div>
      <div className="relative mt-1">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          variant="outline"
          className="w-full justify-between"
        >
          <span className="truncate">
            {isAllRegions
              ? "All Regions"
              : currentRegion
                ? `${currentRegion.region} (${currentRegion.language})`
                : "No region"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
              {/* All Regions Option */}
              <button
                type="button"
                onClick={() => handleSwitchRegion(null)}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm hover:bg-gray-50",
                  isAllRegions && "bg-blue-50 text-blue-700"
                )}
              >
                <div className="flex items-center">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isAllRegions ? "text-blue-700" : "invisible"
                    )}
                  />
                  <div>
                    <div className="font-medium">All Regions</div>
                    <div className="text-xs text-gray-500">Aggregated view</div>
                  </div>
                </div>
              </button>

              <div className="border-t border-gray-200" />

              {/* Individual Regions */}
              {regions.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => handleSwitchRegion(region.id)}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm hover:bg-gray-50",
                    !isAllRegions &&
                      currentRegionId === region.id &&
                      "bg-blue-50 text-blue-700"
                  )}
                >
                  <div className="flex items-center">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !isAllRegions && currentRegionId === region.id
                          ? "text-blue-700"
                          : "invisible"
                      )}
                    />
                    <div>
                      <div className="font-medium">
                        {region.region} ({region.language})
                      </div>
                      {region.is_default && (
                        <div className="text-xs text-gray-500">Default</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {regions.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-500">
                  No regions found
                </div>
              )}

              {/* Add Region Button */}
              <div className="border-t border-gray-200 p-2">
                <AddRegionDialog
                  workspaceId={currentWorkspaceId}
                  currentRegions={regions.map((r) => r.region)}
                  onRegionAdded={async (newRegionId) => {
                    await fetchRegions();
                    setIsOpen(false);

                    // Automatically switch to the new region
                    if (newRegionId && onSwitchToNewRegion) {
                      onSwitchToNewRegion(newRegionId);
                    } else if (newRegionId) {
                      // Fallback: switch directly
                      await handleSwitchRegion(newRegionId);
                    }
                  }}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add region
                  </Button>
                </AddRegionDialog>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
