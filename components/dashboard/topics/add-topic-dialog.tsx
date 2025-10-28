"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { HelpCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddTopicDialogProps {
  workspaceId: string;
}

export function AddTopicDialog({ workspaceId }: AddTopicDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    keywords: "",
    why_it_matters: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const keywordsArray = formData.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const response = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: formData.name,
          description: formData.description,
          why_it_matters: formData.why_it_matters,
          keywords: keywordsArray,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create topic");
      }

      setOpen(false);
      setFormData({
        name: "",
        description: "",
        keywords: "",
        why_it_matters: "",
      });
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create topic");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Topic
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[90vw] max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add New Monitoring Topic</DialogTitle>
        </DialogHeader>
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 px-2">
            <div>
              <Label
                htmlFor="name"
                className="relative mb-2 inline-flex items-center gap-1.5"
              >
                Topic Name *
                <Tooltip
                  content="The main category or theme you want to monitor. This is used by AI to generate relevant prompts, e.g., 'Brand Awareness & Recognition', 'Pricing & Plans', 'Competitor Analysis'"
                  side="top"
                  sideOffset={-12}
                >
                  <HelpCircle className="h-4 w-4 flex-shrink-0 cursor-help text-gray-400 hover:text-gray-600" />
                </Tooltip>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g., Brand Awareness & Recognition"
              />
            </div>

            <div>
              <Label
                htmlFor="description"
                className="relative mb-2 inline-flex items-center gap-1.5"
              >
                Description
                <Tooltip
                  content="Brief explanation of what this topic covers. Helps AI understand the context and generate more accurate monitoring prompts"
                  side="top"
                  sideOffset={-12}
                >
                  <HelpCircle className="h-4 w-4 flex-shrink-0 cursor-help text-gray-400 hover:text-gray-600" />
                </Tooltip>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of what this topic monitors"
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label
                htmlFor="keywords"
                className="relative mb-2 inline-flex items-center gap-1.5"
              >
                Keywords (comma-separated)
                <Tooltip
                  content="Key terms related to this topic. The AI uses these to enrich generated prompts with specific keywords. Example: 'invoice automation, AP software, billing tools'"
                  side="top"
                  sideOffset={-12}
                >
                  <HelpCircle className="h-4 w-4 flex-shrink-0 cursor-help text-gray-400 hover:text-gray-600" />
                </Tooltip>
              </Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) =>
                  setFormData({ ...formData, keywords: e.target.value })
                }
                placeholder="e.g., brand name, product name, service"
              />
            </div>

            <div>
              <Label
                htmlFor="why_it_matters"
                className="relative mb-2 inline-flex items-center gap-1.5"
              >
                Why it matters
                <Tooltip
                  content="Explain the business value of tracking this topic. This helps internal stakeholders understand the importance of monitoring this category"
                  side="top"
                  sideOffset={-12}
                >
                  <HelpCircle className="h-4 w-4 flex-shrink-0 cursor-help text-gray-400 hover:text-gray-600" />
                </Tooltip>
              </Label>
              <Textarea
                id="why_it_matters"
                value={formData.why_it_matters}
                onChange={(e) =>
                  setFormData({ ...formData, why_it_matters: e.target.value })
                }
                placeholder="Explain the business value of monitoring this topic"
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Topic"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
