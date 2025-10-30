"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddRegionDialogProps {
  workspaceId: string;
  currentRegions: string[]; // Array of region names that already exist
  onRegionAdded: (regionId: string) => void;
  children: React.ReactNode;
}

const regions = [
  { value: "United States", label: "🇺🇸 United States" },
  { value: "United Kingdom", label: "🇬🇧 United Kingdom" },
  { value: "Spain", label: "🇪🇸 Spain" },
  { value: "France", label: "🇫🇷 France" },
  { value: "Germany", label: "🇩🇪 Germany" },
  { value: "Italy", label: "🇮🇹 Italy" },
  { value: "Portugal", label: "🇵🇹 Portugal" },
  { value: "Netherlands", label: "🇳🇱 Netherlands" },
  { value: "Canada", label: "🇨🇦 Canada" },
  { value: "Mexico", label: "🇲🇽 Mexico" },
  { value: "Brazil", label: "🇧🇷 Brazil" },
  { value: "Argentina", label: "🇦🇷 Argentina" },
  { value: "Australia", label: "🇦🇺 Australia" },
  { value: "India", label: "🇮🇳 India" },
  { value: "Singapore", label: "🇸🇬 Singapore" },
  { value: "Japan", label: "🇯🇵 Japan" },
];

const languages = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Italian", label: "Italian" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Dutch", label: "Dutch" },
  { value: "Japanese", label: "Japanese" },
  { value: "Chinese", label: "Chinese" },
  { value: "Korean", label: "Korean" },
];

export function AddRegionDialog({
  workspaceId,
  currentRegions,
  onRegionAdded,
  children,
}: AddRegionDialogProps) {
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState("");
  const [language, setLanguage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out regions that already exist
  const availableRegions = regions.filter(
    (r) => !currentRegions.includes(r.value)
  );

  const handleSubmit = async () => {
    if (!region || !language) {
      setError("Please select both region and language");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/workspace-regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          region,
          language,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create region");
      }

      // Reset form and close dialog immediately (generation happens async)
      const newRegionId = result.region?.id;
      setRegion("");
      setLanguage("");
      setIsLoading(false);
      setOpen(false);

      // Store in sessionStorage that generation is happening
      if (newRegionId && typeof window !== "undefined") {
        sessionStorage.setItem(`generating_${newRegionId}`, "true");
        sessionStorage.setItem(
          `generating_region_created`,
          Date.now().toString()
        );
        // Auto-clear after 90 seconds to prevent infinite polling (generation usually takes 10-30s)
        setTimeout(() => {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(`generating_${newRegionId}`);
          }
        }, 90000);
        onRegionAdded(newRegionId);
      } else {
        onRegionAdded("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create region");
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setOpen(true);
    } else {
      // Allow closing when not loading
      if (!isLoading) {
        setOpen(false);
        setRegion("");
        setLanguage("");
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} modal={true} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-w-md"
        onEscapeKeyDown={(e) => {
          if (isLoading) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          if (isLoading) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (isLoading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Add Region</DialogTitle>
          <DialogDescription>
            Add a new region to your workspace. Prompts and topics will be
            generated based on your brand identity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Region Select */}
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger id="region">
                <SelectValue placeholder="Select a region" />
              </SelectTrigger>
              <SelectContent
                className="z-[70]"
                position="popper"
                sideOffset={6}
              >
                {availableRegions.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    All regions have been added
                  </div>
                ) : (
                  availableRegions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Language Select */}
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent
                className="z-[70]"
                position="popper"
                sideOffset={6}
              >
                {languages.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setRegion("");
              setLanguage("");
              setError(null);
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !region || !language}
          >
            {isLoading ? "Adding..." : "Add Region"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
