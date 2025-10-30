# Settings - Final Structure

## Overview

Settings section redesigned to support multi-workspace management with billing at the account level.

## Navigation Structure

```
Settings
├── 👤 Profile
│   ├── Personal Info → Name, email
│   └── Billing → Subscription (account-level)
│
└── 🏢 Workspaces (All workspaces)
    ├── 📁 Workspace A
    │   ├── General → Brand info
    │   └── Team → Members
    ├── 📁 Workspace B
    │   ├── General → Brand info
    │   └── Team → Members
    └── ➕ Create New
```

## Key Design Decisions

### 1. Billing at Account Level ✅

**Rationale:** One subscription per user account, not per workspace

- User pays for a plan (Starter, Growth, Enterprise)
- Plan determines limits across all workspaces
- Simpler billing management
- Located in: `Profile → Billing`

### 2. Multi-Workspace Management ✅

**Rationale:** Users can manage all their workspaces from one place

- No need to switch current workspace to edit settings
- Expandable cards for each workspace
- Clear role badges (Owner, Admin, Analyst)
- Located in: `Workspaces` section

### 3. No Per-Workspace Billing ✅

**Rationale:** Cleaner architecture

- Workspaces only have: General + Team
- Billing is global (account-level)
- Reduces complexity

## Components

### Profile Section

**File:** `profile-section-with-tabs.tsx`

- Tab 1: Personal Info (`profile-info-tab.tsx`)
- Tab 2: Billing (`profile-billing-tab.tsx`)

### Workspaces Section

**File:** `workspaces-section.tsx`

- Lists all workspaces user has access to
- Shows role for each workspace
- Create new workspace button

### Workspace Card

**File:** `workspace-card.tsx`

- Expandable card for each workspace
- Tab 1: General (`workspace-general-tab.tsx`)
- Tab 2: Team (`workspace-team-tab.tsx`)

## User Flows

### Managing Personal Info

```
Settings → Profile → Personal Info
- Edit name
- View email (read-only)
```

### Managing Subscription

```
Settings → Profile → Billing
- View current plan
- Access Stripe Portal
- Upgrade/downgrade
- View invoices
```

### Managing Workspace Settings

```
Settings → Workspaces → [Select Workspace] → General
- Edit brand name
- Edit website
- Edit description
```

### Managing Team

```
Settings → Workspaces → [Select Workspace] → Team
- View members
- Invite members (if has permission)
- Remove members (if owner)
- View role permissions
```

### Creating New Workspace

```
Settings → Workspaces → Create New
- Opens workspace creation modal
- Plan limits apply
```

## Plan Limits (Account-Level)

### Starter Plan ($99/month)

- 1 workspace
- 1 member per workspace
- 50 prompts/month

### Growth Plan ($399/month)

- 3 workspaces
- 3 members per workspace
- 100 prompts/month

### Enterprise Plan (Custom)

- Unlimited workspaces
- Unlimited members
- Unlimited prompts

## Permissions

### Role Hierarchy

- **Owner**: Full access (workspace + team management)
- **Admin**: Can edit workspace + invite members
- **Analyst**: View-only access

### Permission Matrix

| Action                  | Owner | Admin | Analyst |
| ----------------------- | ----- | ----- | ------- |
| Edit workspace settings | ✅    | ✅    | ❌      |
| Invite members          | ✅    | ✅    | ❌      |
| Remove members          | ✅    | ❌    | ❌      |
| View data               | ✅    | ✅    | ✅      |

## Files Created/Modified

### New Files (8)

1. `profile-section-with-tabs.tsx` - Profile with tabs
2. `profile-info-tab.tsx` - Personal information
3. `profile-billing-tab.tsx` - Billing management
4. `workspaces-section.tsx` - All workspaces list
5. `workspace-card.tsx` - Expandable workspace card
6. `workspace-general-tab.tsx` - Brand settings
7. `workspace-team-tab.tsx` - Team management
8. `settings-nav.tsx` - Updated navigation

### Deleted Files (3)

1. `profile-section.tsx` - Replaced by profile-section-with-tabs
2. `workspace-section-with-tabs.tsx` - Replaced by workspaces-section
3. `workspace-billing-tab.tsx` - Moved to profile

### Modified Files

1. `app/(dashboard)/dashboard/settings/page.tsx` - Updated structure
2. `settings-nav.tsx` - Simplified to 2 sections

## Benefits

✅ **Clearer Information Architecture**: Billing clearly at account level  
✅ **Multi-Workspace Support**: Manage all workspaces without switching  
✅ **Scalable**: Easy to add more workspaces as plan allows  
✅ **Better UX**: No confusion about workspace vs account settings  
✅ **Role-Based Access**: Clear permissions throughout  
✅ **Modern UI**: Expandable cards, toast notifications, clean design

## Technical Stack

- **State Management**: Zustand (toast), React hooks
- **Data Fetching**: Supabase client
- **UI Components**: Shadcn UI (Tabs, Cards, Badges)
- **Permissions**: Role-based with helper functions
- **Validation**: Client-side with toast feedback
