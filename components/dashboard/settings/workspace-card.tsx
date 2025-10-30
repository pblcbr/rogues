"use client";

import { useState } from "react";
import { Building2, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WorkspaceGeneralTab } from "./workspace-general-tab";
import { WorkspaceTeamTab } from "./workspace-team-tab";
import type { WorkspaceRole } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils";

interface WorkspaceCardProps {
  workspace: any;
  userRole: WorkspaceRole;
  user: any;
  onUpdate?: () => void;
}

const roleColors = {
  owner: "border-yellow-200 bg-yellow-50 text-yellow-700",
  admin: "border-blue-200 bg-blue-50 text-blue-700",
  analyst: "border-gray-200 bg-gray-50 text-gray-700",
};

/**
 * Workspace Card
 * Expandable card showing workspace settings
 */
export function WorkspaceCard({
  workspace,
  userRole,
  user,
  onUpdate,
}: WorkspaceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Card Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900">
              {workspace.brand_name || "Unnamed Workspace"}
            </h3>
            {workspace.brand_website && (
              <p className="text-sm text-gray-500">{workspace.brand_website}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={roleColors[userRole]}>
            {userRole}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-200 bg-gray-50 px-4 pt-3">
              <TabsList>
                <TabsTrigger value="general">
                  <Building2 className="mr-2 h-4 w-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="team">
                  <Users className="mr-2 h-4 w-4" />
                  Team
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4">
              <TabsContent value="general" className="mt-0">
                <WorkspaceGeneralTab
                  workspace={workspace}
                  user={user}
                  userRole={userRole}
                />
              </TabsContent>

              <TabsContent value="team" className="mt-0">
                <WorkspaceTeamTab
                  workspace={workspace}
                  user={user}
                  userRole={userRole}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}
