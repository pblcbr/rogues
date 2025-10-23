"use client";

import { useEffect, useState, useCallback } from "react";
import { useRegistrationStore } from "@/stores/registration";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressIndicator } from "../progress-indicator";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import {
  extractDomain,
  type GeneratedPrompt,
} from "@/lib/openai/prompt-generator";

/**
 * Step 5: AI-Powered Prompt Generation
 * Generates prompts based on company domain using OpenAI
 */
export function StepPrompts() {
  const {
    email,
    generatedPrompts,
    selectedPrompts,
    customPrompts,
    isGeneratingPrompts,
    setGeneratedPrompts,
    setSelectedPrompts,
    addCustomPrompt,
    setGeneratingPrompts,
    nextStep,
    previousStep,
  } = useRegistrationStore();

  const [newCustomPrompt, setNewCustomPrompt] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const generatePrompts = useCallback(async () => {
    setGeneratingPrompts(true);
    try {
      const domain = extractDomain(email || "");
      const response = await fetch("/api/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setGeneratedPrompts(result.prompts);
      // Auto-select first 5 prompts
      setSelectedPrompts(
        result.prompts.slice(0, 5).map((p: GeneratedPrompt) => p.text)
      );
    } catch (error) {
      console.error("Error generating prompts:", error);
    } finally {
      setGeneratingPrompts(false);
    }
  }, [email, setGeneratedPrompts, setSelectedPrompts, setGeneratingPrompts]);

  useEffect(() => {
    if (generatedPrompts.length === 0 && !isGeneratingPrompts) {
      generatePrompts();
    }
  }, [generatedPrompts.length, isGeneratingPrompts, generatePrompts]);

  const togglePrompt = (promptText: string) => {
    if (selectedPrompts.includes(promptText)) {
      setSelectedPrompts(selectedPrompts.filter((p) => p !== promptText));
    } else if (selectedPrompts.length < 10) {
      setSelectedPrompts([...selectedPrompts, promptText]);
    }
  };

  const handleAddCustom = () => {
    if (newCustomPrompt.trim() && customPrompts.length < 5) {
      addCustomPrompt(newCustomPrompt.trim());
      setNewCustomPrompt("");
      setShowCustomInput(false);
    }
  };

  const handleContinue = () => {
    if (selectedPrompts.length === 0 && customPrompts.length === 0) {
      alert("Please select at least one prompt");
      return;
    }
    nextStep();
  };

  if (isGeneratingPrompts) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            Analyzing your company&apos;s AI visibility...
          </h2>
          <p className="text-muted-foreground">
            We&apos;re creating personalized prompts based on{" "}
            {extractDomain(email || "")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressIndicator currentStep={5} totalSteps={8} />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Which topics do you want to create prompts for?
        </h1>
        <p className="text-muted-foreground">Select up to 10 topics</p>
      </div>

      <div className="space-y-3">
        {generatedPrompts.map((prompt, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
          >
            <Checkbox
              id={`prompt-${index}`}
              checked={selectedPrompts.includes(prompt.text)}
              onCheckedChange={() => togglePrompt(prompt.text)}
              disabled={
                !selectedPrompts.includes(prompt.text) &&
                selectedPrompts.length >= 10
              }
            />
            <Label
              htmlFor={`prompt-${index}`}
              className="flex-1 cursor-pointer font-normal leading-tight"
            >
              {prompt.text}
            </Label>
          </div>
        ))}

        {customPrompts.map((prompt, index) => (
          <div
            key={`custom-${index}`}
            className="flex items-start space-x-3 rounded-lg border border-primary/50 bg-primary/5 p-4"
          >
            <Checkbox checked={true} disabled />
            <Label className="flex-1 font-normal leading-tight">{prompt}</Label>
          </div>
        ))}

        {showCustomInput ? (
          <div className="flex gap-2">
            <Input
              placeholder="Enter custom prompt..."
              value={newCustomPrompt}
              onChange={(e) => setNewCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCustom();
              }}
            />
            <Button onClick={handleAddCustom} size="sm">
              Add
            </Button>
            <Button
              onClick={() => setShowCustomInput(false)}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            disabled={customPrompts.length >= 5}
            className="flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add custom prompt (max 5)
          </button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="mb-2 font-semibold">Topic Selection Tips</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>✓ Each topic generates 5 prompts to track</li>
          <li>✓ Try using keywords from traditional search tools</li>
          <li>✓ Avoid long phrases - keep them short</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={previousStep}
          className="w-32"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleContinue} className="flex-1">
          Looks good
        </Button>
      </div>
    </div>
  );
}
