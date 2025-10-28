"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Crown, CreditCard, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface WorkspaceSettingsProps {
  workspace: any;
  user: any;
}

/**
 * Workspace Settings Component
 * Manage workspace name, domain, and basic settings
 */
export function WorkspaceSettings({ workspace, user }: WorkspaceSettingsProps) {
  const [companyName, setCompanyName] = useState(workspace?.company_name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [newCompName, setNewCompName] = useState("");
  const [newCompDomain, setNewCompDomain] = useState("");
  const supabase = createClient();

  const plan = (workspace?.plan_id || workspace?.plan || "starter") as string;
  const cap = plan === "starter" ? 1 : plan === "growth" ? 3 : 5;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/models");
        const json = await res.json();
        setModels((json.models || []).slice(0, 5));
      } catch {}
      // Load saved allowed models from workspaces.settings
      try {
        const { data } = await supabase
          .from("workspaces")
          .select("settings")
          .eq("id", workspace?.id)
          .single();
        const allowed = (data?.settings?.allowed_models as string[]) || [];
        setSelectedModels(allowed.slice(0, 5));
      } catch {}

      // Load competitors
      try {
        const res = await fetch(
          `/api/competitors?workspaceId=${workspace?.id}`
        );
        const json = await res.json();
        setCompetitors(json.competitors || []);
      } catch {}
    })();
  }, [supabase, workspace?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Persist workspace name (placeholder field) and allowed models in settings
      const { error } = await supabase
        .from("workspaces")
        .update({
          name: companyName,
          settings: { allowed_models: selectedModels.slice(0, cap) },
        })
        .eq("id", workspace?.id);
      if (error) throw error;
      alert("Settings saved successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const addCompetitor = async () => {
    if (!newCompName || competitors.length >= 5) return;
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace?.id,
          name: newCompName,
          domain: newCompDomain,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed");
      setCompetitors((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).slice(2),
          name: newCompName,
          domain: newCompDomain,
        },
      ]);
      setNewCompName("");
      setNewCompDomain("");
    } catch (e: any) {
      alert(e?.message || "Failed to add competitor");
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Workspace Settings
              </h2>
              <p className="text-sm text-gray-500">
                Manage your workspace details
              </p>
            </div>
          </div>
          <Badge className="border-purple-200 bg-purple-100 text-purple-700">
            <Crown className="mr-1 h-3 w-3" />
            {workspace?.plan_id || "starter"}
          </Badge>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6 p-6">
        {/* Company Name */}
        <div>
          <Label htmlFor="company-name">Company Name</Label>
          <Input
            id="company-name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Inc."
            className="mt-1"
          />
          <p className="mt-1 text-xs text-gray-500">
            This is your workspace display name
          </p>
        </div>

        {/* Domain */}
        <div>
          <Label htmlFor="domain">Company Domain</Label>
          <Input
            id="domain"
            value={user?.email?.split("@")[1] || ""}
            disabled
            className="mt-1 bg-gray-50"
          />
          <p className="mt-1 text-xs text-gray-500">
            Domain extracted from your email (cannot be changed)
          </p>
        </div>

        {/* Plan */}
        <div>
          <Label>Current Plan</Label>
          <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium capitalize text-gray-900">
                  {workspace?.plan_id || "Starter"} Plan
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {workspace?.plan_id === "starter" &&
                    "5 prompts, 1 workspace, basic features"}
                  {workspace?.plan_id === "growth" &&
                    "50 prompts, 3 workspaces, advanced features"}
                  {workspace?.plan_id === "enterprise" &&
                    "Unlimited prompts, unlimited workspaces, all features"}
                </p>
              </div>
              <Button variant="outline">Upgrade</Button>
            </div>
          </div>
        </div>

        {/* Models to track (up to 5 overall, capped by plan) */}
        <div>
          <Label>Models to track</Label>
          <p className="mt-1 text-xs text-gray-500">
            Select up to {cap} model{cap > 1 ? "s" : ""} (
            {selectedModels.length}/{cap})
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {models.map((m) => {
              const checked = selectedModels.includes(m.id);
              const disabled = !checked && selectedModels.length >= cap;
              return (
                <label
                  key={m.id}
                  className={`flex items-center space-x-2 rounded-md border p-2 ${
                    checked ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  } ${disabled ? "opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedModels((prev) =>
                          Array.from(new Set([...prev, m.id])).slice(0, cap)
                        );
                      } else {
                        setSelectedModels((prev) =>
                          prev.filter((id) => id !== m.id)
                        );
                      }
                    }}
                  />
                  <span className="text-sm">{m.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Competitors (up to 5) */}
        <div>
          <Label>Competitors (max 5)</Label>
          <div className="mt-2 grid gap-2">
            {competitors.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-md border border-gray-200 p-2 text-sm"
              >
                <div>
                  <div className="font-medium text-gray-900">{c.name}</div>
                  {c.domain && <div className="text-gray-500">{c.domain}</div>}
                </div>
                <Badge variant="secondary">Competitor</Badge>
              </div>
            ))}
            {competitors.length < 5 && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Name"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                />
                <Input
                  placeholder="Domain (optional)"
                  value={newCompDomain}
                  onChange={(e) => setNewCompDomain(e.target.value)}
                />
                <div className="col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCompetitor}
                    disabled={!newCompName}
                  >
                    Add competitor
                  </Button>
                </div>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Used for Share of Voice calculations.
          </p>
        </div>

        {/* Billing Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="mb-4 flex items-center space-x-2 text-base font-semibold text-gray-900">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span>Billing</span>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Current Plan</p>
                <p className="text-sm text-gray-500 capitalize">{plan}</p>
              </div>
              <Button variant="outline" size="sm">
                Upgrade Plan
              </Button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Payment Method</p>
                <p className="text-sm text-gray-500">
                  {workspace?.stripe_customer_id ? "Card on file" : "None"}
                </p>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Billing History</p>
                <p className="text-sm text-gray-500">View and download invoices</p>
              </div>
              <Button variant="outline" size="sm">
                View History
              </Button>
            </div>
          </div>
        </div>

        {/* Workspace ID */}
        <div>
          <Label>Workspace ID</Label>
          <Input
            value={workspace?.id || ""}
            disabled
            className="mt-1 bg-gray-50 font-mono text-xs"
          />
          <p className="mt-1 text-xs text-gray-500">
            Use this ID for API integrations
          </p>
        </div>

        {/* Save Button */}
        <div className="border-t border-gray-200 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
