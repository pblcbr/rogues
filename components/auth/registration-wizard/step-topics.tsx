"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRegistrationStore } from "@/stores/registration";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ProgressIndicator } from "../progress-indicator";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { type GeneratedTopic } from "@/lib/openai/topic-generator";
import { extractDomain } from "@/lib/openai/utils";

/**
 * Step 8: AI-Powered Topic Generation
 * Generates topics based on company domain using OpenAI
 */
export function StepTopics() {
  const {
    brandWebsite,
    brandDescription,
    region,
    language,
    generatedTopics,
    selectedTopics,
    customTopics,
    isGeneratingTopics,
    setGeneratedTopics,
    setSelectedTopics,
    addCustomTopic,
    setGeneratingTopics,
    nextStep,
    previousStep,
  } = useRegistrationStore();

  const [newCustomTopic, setNewCustomTopic] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  const domain = brandWebsite || "";
  const faviconUrl = domain ? `/api/favicon?domain=${domain}` : null;

  const brandInitial = useMemo(() => {
    if (!domain) return "";
    const parts = domain.split(".").filter(Boolean);
    const sld = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    return sld?.[0]?.toUpperCase() || "";
  }, [domain]);

  const analysisMessages = [
    `Analyzing ${domain} industry and market position…`,
    "Identifying key buyer personas and decision stages…",
    "Mapping strategic topic categories across the customer journey…",
    "Determining competitive intelligence and credibility topics…",
    "Checking for regional compliance and security requirements…",
    "Validating topic diversity and business value alignment…",
  ];

  const generateTopics = useCallback(async () => {
    console.log("🎯 [Frontend] Starting topic generation...");
    console.log("🎯 [Frontend] Brand Website:", brandWebsite);
    console.log("🎯 [Frontend] Brand Description:", brandDescription);

    setGeneratingTopics(true);
    try {
      const domain = brandWebsite || "";
      console.log("🎯 [Frontend] Domain:", domain);

      if (!domain) {
        console.error("🎯 [Frontend] ❌ No domain provided");
        throw new Error("Could not get domain from brand website");
      }

      console.log("🎯 [Frontend] Calling API /api/topics/generate...");
      console.log("🎯 [Frontend] Region:", region);
      console.log("🎯 [Frontend] Language:", language);

      const response = await fetch("/api/topics/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          brandDescription,
          region: region || "United States",
          language: language || "English (en)",
        }),
      });

      console.log("🎯 [Frontend] API response status:", response.status);
      const result = await response.json();
      console.log("🎯 [Frontend] API response body:", result);

      if (result.error) {
        throw new Error(result.error);
      }

      console.log("🎯 [Frontend] ✅ Received", result.topics.length, "topics");
      console.log("🎯 [Frontend] Using fallback?", result.usingFallback);

      // Defensive: ensure array
      const topicsArray = Array.isArray(result.topics) ? result.topics : [];
      setGeneratedTopics(topicsArray);
      setUsingFallback(result.usingFallback || false);

      // Auto-select first 5 topics
      setSelectedTopics(
        topicsArray.slice(0, 5).map((t: GeneratedTopic) => t.name)
      );

      console.log("🎯 [Frontend] ✅ Topic generation complete!");
    } catch (error) {
      console.error("🎯 [Frontend] ❌ Error generating topics:", error);
      alert("Failed to generate topics. Please try again or contact support.");
    } finally {
      setGeneratingTopics(false);
    }
  }, [
    brandWebsite,
    brandDescription,
    region,
    language,
    setGeneratedTopics,
    setSelectedTopics,
    setGeneratingTopics,
  ]);

  useEffect(() => {
    if (generatedTopics.length === 0 && !isGeneratingTopics) {
      generateTopics();
    }
  }, [generatedTopics.length, isGeneratingTopics, generateTopics]);

  // Hide testimonials/right panel while on topics screen
  useEffect(() => {
    document.body.classList.add("hide-auth-right");
    return () => document.body.classList.remove("hide-auth-right");
  }, []);

  // Rotate analysis messages while generating (slower cadence)
  useEffect(() => {
    if (!isGeneratingTopics) return;
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % analysisMessages.length);
    }, 3000);
    return () => clearInterval(id);
  }, [isGeneratingTopics, analysisMessages.length]);

  const toggleTopic = (topicName: string) => {
    if (selectedTopics.includes(topicName)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topicName));
    } else if (selectedTopics.length < 10) {
      setSelectedTopics([...selectedTopics, topicName]);
    }
  };

  const handleAddCustom = () => {
    if (newCustomTopic.trim() && customTopics.length < 5) {
      addCustomTopic(newCustomTopic.trim());
      setNewCustomTopic("");
      setShowCustomInput(false);
    }
  };

  const handleContinue = () => {
    if (selectedTopics.length === 0) {
      alert("Please select at least one topic");
      return;
    }
    nextStep();
  };

  // Full-screen page (not just overlay)
  const GeneratingOverlay = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"></div>
      <div className="mx-6 w-full max-w-2xl rounded-xl bg-card/90 p-10 shadow-2xl">
        {/* Favicon/brand mark on top */}
        <div className="mb-4 flex justify-center">
          {faviconUrl && !faviconFailed ? (
            <img
              src={faviconUrl}
              alt={`${domain} favicon`}
              width={44}
              height={44}
              className="h-11 w-11 rounded-md bg-white shadow"
              loading="eager"
              referrerPolicy="no-referrer"
              onError={() => setFaviconFailed(true)}
            />
          ) : (
            <div
              aria-hidden
              className="flex h-11 w-11 items-center justify-center rounded-md bg-muted text-base font-semibold shadow"
            >
              {brandInitial}
            </div>
          )}
        </div>
        {/* Rotating phrase */}
        <div className="min-h-[84px] text-center text-muted-foreground">
          <p className="leading-relaxed">{analysisMessages[messageIndex]}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {isGeneratingTopics && <GeneratingOverlay />}
      <ProgressIndicator currentStep={8} totalSteps={11} />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Select Topics to Monitor. Later you will be able to add more topics
          and prompts.
        </h1>
        <p className="text-muted-foreground">
          Choose up to 10 strategic areas to track your brand visibility in AI
          search engines
        </p>
      </div>

      {usingFallback && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            ℹ️ Using generic topics. To get AI-powered personalized topics based
            on your company, configure OpenAI API key in your environment
            variables.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {generatedTopics.map((topic, index) => (
          <div
            key={index}
            className="flex cursor-pointer items-start space-x-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            onClick={() => toggleTopic(topic.name)}
          >
            <Checkbox
              id={`topic-${index}`}
              checked={selectedTopics.includes(topic.name)}
              disabled={
                !selectedTopics.includes(topic.name) &&
                selectedTopics.length >= 10
              }
              className="mt-1"
            />

            <div className="flex-1">
              <Label
                htmlFor={`topic-${index}`}
                className="cursor-pointer font-semibold leading-tight"
              >
                {topic.name}
              </Label>{" "}
              <span className="ml-2 text-xs text-muted-foreground">
                ~{topic.estimated_prompts} prompts
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                {topic.description}
              </p>
            </div>
          </div>
        ))}

        {customTopics.map((topic, index) => (
          <div
            key={`custom-${index}`}
            className="flex cursor-pointer items-start space-x-3 rounded-lg border border-primary/50 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
            onClick={() => toggleTopic(topic)}
          >
            <Checkbox
              id={`custom-topic-${index}`}
              checked={selectedTopics.includes(topic)}
              disabled={
                !selectedTopics.includes(topic) && selectedTopics.length >= 10
              }
              className="mt-1"
            />
            <div className="flex-1">
              <Label
                htmlFor={`custom-topic-${index}`}
                className="cursor-pointer font-semibold leading-tight"
              >
                {topic}
              </Label>
            </div>
          </div>
        ))}

        {showCustomInput ? (
          <div className="flex gap-2">
            <Input
              placeholder="Enter custom topic name..."
              value={newCustomTopic}
              onChange={(e) => setNewCustomTopic(e.target.value)}
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
            disabled={customTopics.length >= 5}
            className="flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add custom topic (max 5)
          </button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="mb-2 font-semibold">What are Topics?</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            ✓ Topics are strategic categories that group related search queries
          </li>
          <li>
            ✓ Each topic will later contain multiple specific prompts to monitor
          </li>
          <li>
            ✓ Select topics that align with your business goals and buyer
            journey
          </li>
        </ul>
      </div>

      <div className="flex gap-3">
        {/* Back button removed after email verification to prevent navigation issues */}
        <Button onClick={handleContinue} className="w-full">
          Continue
        </Button>
      </div>
    </div>
  );
}
