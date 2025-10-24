"use client";

import { useState } from "react";
import { useRegistrationStore } from "@/stores/registration";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ProgressIndicator } from "../progress-indicator";

/**
 * Step 5: Brand Information
 * Collect website and optional brand description
 */
export function StepBrand() {
  const {
    email,
    brandWebsite: storedWebsite,
    brandDescription: storedDescription,
    setBrandInfo,
    nextStep,
    previousStep,
  } = useRegistrationStore();

  // Extract domain from email as default
  const defaultDomain = email ? email.split("@")[1] : "";

  const [website, setWebsite] = useState(storedWebsite || defaultDomain);
  const [description, setDescription] = useState(storedDescription || "");

  const handleContinue = () => {
    if (!website.trim()) {
      alert("Please enter your website");
      return;
    }

    // Store brand info in the registration store
    setBrandInfo(website.trim(), description.trim());
    console.log("Website:", website);
    console.log("Description:", description);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <ProgressIndicator currentStep={5} totalSteps={11} />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Start tracking your brand
        </h1>
        <p className="text-muted-foreground">
          This will be the first brand you'll track on Rogues — you can add more
          later.
        </p>
      </div>

      <div className="space-y-4">
        {/* Website Input */}
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <div className="flex items-center">
            <span className="inline-flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              https://
            </span>
            <Input
              id="website"
              type="text"
              placeholder="taclia.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="rounded-l-none"
              required
            />
          </div>
        </div>

        {/* Brand Description (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Tell us about your brand{" "}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <textarea
            id="description"
            placeholder="About your brand..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground">
            The more specific you are, the better the results we'll be able to
            provide.
          </p>
          <ul className="ml-4 space-y-1 text-xs text-muted-foreground">
            <li>• What products or services do you offer?</li>
            <li>• Do you serve any specific regions?</li>
          </ul>
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
