"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Crown } from "lucide-react";

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Implement save logic
    setTimeout(() => {
      setIsLoading(false);
      alert("Settings saved successfully!");
    }, 1000);
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
