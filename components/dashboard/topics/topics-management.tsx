"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface TopicsManagementProps {
  topics: any[];
}

export function TopicsManagement({ topics }: TopicsManagementProps) {
  const router = useRouter();
  const [newTopicName, setNewTopicName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;

    setIsAdding(true);
    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: topics[0]?.workspace_id || "",
          name: newTopicName.trim(),
          keywords: [],
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to create topic");
      }

      setNewTopicName("");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create topic");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleActive = async (topic: any) => {
    try {
      const response = await fetch("/api/topics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topic.id,
          is_selected: !topic.is_selected,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to update topic");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update topic");
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="p-4">
        {/* Add Topic Input */}
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
          <Input
            placeholder="Add a new monitoring topic..."
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTopic()}
            className="bg-white"
          />
          <Button
            onClick={handleAddTopic}
            disabled={!newTopicName.trim() || isAdding}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Topics List */}
        {topics && topics.length > 0 ? (
          <div className="grid gap-4">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <p className="font-medium text-gray-900">{topic.name}</p>
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {topic.promptCount || 0} prompts
                  </span>
                </div>
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleActive(topic);
                  }}
                >
                  <Checkbox
                    checked={topic.is_selected}
                    onCheckedChange={() => handleToggleActive(topic)}
                  />
                  <span className="text-sm text-gray-600">
                    {topic.is_selected ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">
            No topics yet. Add topics above to start monitoring.
          </p>
        )}
      </div>
    </div>
  );
}
