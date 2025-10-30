"use client";

import { useState } from "react";
import { useRegistrationStore } from "@/stores/registration";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProgressIndicator } from "../progress-indicator";

/**
 * Step 6: Region & Language Selection
 * Select primary region and language for AI prompt generation
 */
export function StepRegion() {
  const {
    region: storedRegion,
    language: storedLanguage,
    setRegionLanguage,
    nextStep,
    previousStep,
  } = useRegistrationStore();

  const [region, setRegion] = useState(storedRegion || "United States");
  const [language, setLanguage] = useState(storedLanguage || "English");

  const regions = [
    { value: "United States", label: "🇺🇸 United States", flag: "🇺🇸" },
    { value: "United Kingdom", label: "🇬🇧 United Kingdom", flag: "🇬🇧" },
    { value: "Spain", label: "🇪🇸 Spain", flag: "🇪🇸" },
    { value: "France", label: "🇫🇷 France", flag: "🇫🇷" },
    { value: "Germany", label: "🇩🇪 Germany", flag: "🇩🇪" },
    { value: "Italy", label: "🇮🇹 Italy", flag: "🇮🇹" },
    { value: "Portugal", label: "🇵🇹 Portugal", flag: "🇵🇹" },
    { value: "Netherlands", label: "🇳🇱 Netherlands", flag: "🇳🇱" },
    { value: "Canada", label: "🇨🇦 Canada", flag: "🇨🇦" },
    { value: "Mexico", label: "🇲🇽 Mexico", flag: "🇲🇽" },
    { value: "Brazil", label: "🇧🇷 Brazil", flag: "🇧🇷" },
    { value: "Argentina", label: "🇦🇷 Argentina", flag: "🇦🇷" },
    { value: "Australia", label: "🇦🇺 Australia", flag: "🇦🇺" },
    { value: "India", label: "🇮🇳 India", flag: "🇮🇳" },
    { value: "Singapore", label: "🇸🇬 Singapore", flag: "🇸🇬" },
    { value: "Japan", label: "🇯🇵 Japan", flag: "🇯🇵" },
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

  const handleContinue = () => {
    // Store region and language in the registration store
    setRegionLanguage(region, language);
    console.log("Region:", region);
    console.log("Language:", language);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <ProgressIndicator currentStep={6} totalSteps={11} />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Which region do you want to run your prompts in?
        </h1>
        <p className="text-muted-foreground">
          Choose the primary region that your audience is located. Later you
          will be able to add more regions to your workspace.
        </p>
      </div>

      <div className="space-y-4">
        {/* Region Select */}
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger id="region">
              <SelectValue placeholder="Select a region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
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
            <SelectContent>
              {languages.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={previousStep} variant="outline" className="w-full">
          Back
        </Button>
        <Button onClick={handleContinue} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}
