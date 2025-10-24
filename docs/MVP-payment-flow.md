# MVP: Payment Flow & Security

⚠️ **CRITICAL SECURITY**: Users MUST complete payment before accessing the dashboard.

## Current Flow (MVP)

```
Step 1: Email
Step 2: Company Info
Step 3: Create Account (with auto-login)
Step 4: ❌ SKIPPED (Email Verification)
Step 5: Prompts
Step 6: Pricing → MUST REDIRECT TO STRIPE
Step 7: (Not implemented yet - Stripe callback)
Step 8: Welcome → DISABLED auto-workspace creation
Dashboard: BLOCKED if no workspace exists
```

## ⚠️ Security Measures Implemented

### 1. **Workspace Creation Disabled**

- **File**: `components/auth/registration-wizard/step-welcome.tsx`
- **Change**: Commented out `initializeWorkspace()` call
- **Reason**: Workspace was being created with "growth" plan WITHOUT payment verification

### 2. **Dashboard Access Protected**

- **File**: `app/(dashboard)/dashboard/page.tsx`
- **Change**: Added check for `workspace_id` before allowing access
- **Result**: Users without workspace see "Payment Required" screen

### 3. **Pricing Must Go to Stripe**

- **File**: `components/auth/registration-wizard/step-pricing.tsx`
- **Behavior**: Clicking a plan redirects to Stripe checkout
- **No bypass**: Users cannot skip payment

## ❌ Critical Bugs Fixed

### Bug: Free Access Without Payment

**Problem**:

```typescript
// In app/api/workspace/initialize/route.ts (line 41)
plan: "growth", // ❌ Default plan without payment!
```

**Impact**: Users could access dashboard with full Growth plan without paying.

**Solution**:

1. Disabled automatic workspace creation in `step-welcome.tsx`
2. Added dashboard protection to check for workspace
3. Workspace should ONLY be created via Stripe webhook (not implemented yet)

## 🚧 TODO: Stripe Webhook Integration

### What's Needed

1. **Stripe Webhook Endpoint**: `/api/stripe/webhook`
2. **On Payment Success**:
   - Create workspace with paid plan
   - Link workspace to user profile
   - Send welcome email
3. **On Payment Failed**:
   - Log error
   - Don't create workspace

### Implementation Steps

```typescript
// app/api/stripe/webhook/route.ts
export async function POST(request: NextRequest) {
  const event = await stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Create workspace with paid plan
    await supabase.from("workspaces").insert({
      name: `${user.name}'s Workspace`,
      owner_id: session.metadata.userId,
      plan: session.metadata.planId, // from checkout
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
    });
  }
}
```

## Current Registration Flow Security

```
✅ User creates account → auto-login
✅ User selects prompts → no access yet
✅ User sees pricing → MUST click a plan
✅ Redirects to Stripe → payment required
⏳ Stripe processes payment
❌ (Not implemented) Webhook creates workspace
❌ (Not implemented) User redirected to success page
❌ User tries to access dashboard → BLOCKED (no workspace)
```

## How to Test MVP Flow

1. **Register new account**: `test@example.com`
2. **Complete steps 1-5**: Email, Company, Account, Prompts
3. **Step 6 (Pricing)**: Click a plan
4. **Expected**: Redirected to Stripe checkout
5. **Try to access dashboard**: `/dashboard`
6. **Expected**: "Payment Required" screen

## Quick Fixes for MVP Demo

If you need to give temporary access for testing:

### Option 1: Manual Workspace Creation (SQL)

```sql
INSERT INTO workspaces (id, name, owner_id, plan, domain)
VALUES (
  gen_random_uuid(),
  'Demo Workspace',
  'USER_ID_HERE',
  'growth',
  'company.com'
);

UPDATE profiles SET workspace_id = 'WORKSPACE_ID_HERE' WHERE id = 'USER_ID_HERE';
```

### Option 2: Temporary Bypass (NOT FOR PRODUCTION)

In `app/(dashboard)/dashboard/page.tsx`, comment out lines 32-52.

⚠️ **WARNING**: This bypasses payment. Only for internal testing.

## Production Checklist

Before launch:

- [ ] Implement Stripe webhook
- [ ] Test payment flow end-to-end
- [ ] Verify workspace creation on payment
- [ ] Test failed payment scenarios
- [ ] Add subscription management
- [ ] Add plan upgrade/downgrade
- [ ] Test cancellation flow
- [ ] Add usage limits per plan

---

**Last Updated**: October 24, 2025
**Status**: Payment protection **ENABLED**, webhook integration **PENDING**
