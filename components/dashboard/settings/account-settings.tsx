"use client";

import { CreditCard, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AccountSettingsProps {
  user: any;
  workspace: any;
}

/**
 * Account Settings Component
 * Manage account-level settings (billing, team members, security)
 */
export function AccountSettings({ user, workspace }: AccountSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Billing Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center space-x-3">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 py-3">
            <div>
              <p className="font-medium text-gray-900">Current Plan</p>
              <p className="text-sm capitalize text-gray-500">
                {workspace?.plan || "starter"}
              </p>
            </div>
            <Button variant="outline" size="sm">
              Upgrade Plan
            </Button>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 py-3">
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
              <p className="text-sm text-gray-500">
                View and download invoices
              </p>
            </div>
            <Button variant="outline" size="sm">
              View History
            </Button>
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center space-x-3">
          <Users className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
        </div>
        <div className="space-y-4">
          <p className="mb-4 text-sm text-gray-500">
            Manage users who have access to your account
          </p>
          <div className="flex items-center justify-between border-b border-gray-100 py-3">
            <div>
              <p className="font-medium text-gray-900">{user?.email}</p>
              <p className="text-sm text-gray-500">Owner</p>
            </div>
            <Badge variant="secondary">Owner</Badge>
          </div>
          <Button className="w-full" variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Invite Team Member
          </Button>
        </div>
      </div>

      {/* Security Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center space-x-3">
          <Shield className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Security</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 py-3">
            <div>
              <p className="font-medium text-gray-900">Change Password</p>
              <p className="text-sm text-gray-500">
                Update your account password
              </p>
            </div>
            <Button variant="outline" size="sm">
              Change
            </Button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">
                Two-Factor Authentication
              </p>
              <p className="text-sm text-gray-500">
                Add an extra layer of security
              </p>
            </div>
            <Button variant="outline" size="sm">
              Enable
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
