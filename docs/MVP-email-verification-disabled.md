# MVP: Email Verification Disabled

⚠️ **IMPORTANT**: For MVP purposes, email verification has been **temporarily disabled** but **NOT removed**.

## Current Flow (MVP)

```
Step 1: Email
Step 2: Company Info
Step 3: Create Account
Step 4: ❌ SKIPPED (Email Verification)
Step 5: Prompts
Step 6: Pricing
Step 7: Payment (Stripe)
Step 8: Welcome
```

## What Was Changed

### 1. Supabase Dashboard Configuration

**You need to do this manually:**

- Go to: Authentication > Providers > Email
- Set **"Confirm email"** to **OFF**
- This allows users to sign in without verifying their email

### 2. Frontend Changes

#### `components/auth/registration-wizard/step-account.tsx`

- Lines 148-175: Double `nextStep()` call skips verification
- Original code is **commented out**, ready to restore

#### `app/api/auth/signup/route.ts`

- Lines 69-73: Added comment explaining email verification is disabled
- Code still includes `emailRedirectTo` for easy re-enabling

#### `components/auth/registration-wizard/index.tsx`

- Lines 18-19: Added comments explaining Step 4 is skipped
- Step 4 component still renders if accessed directly (safety)

## How to Re-Enable Email Verification (After MVP)

### Step 1: Update Supabase Dashboard

1. Go to: Authentication > Providers > Email
2. Set **"Confirm email"** to **ON**
3. Configure email templates if needed

### Step 2: Update Frontend Code

#### In `step-account.tsx` (around line 148)

**Replace this:**

```typescript
// ===== MVP: EMAIL VERIFICATION DISABLED =====
console.log("⚡ [MVP] Skipping email verification, going to prompts");
nextStep(); // Skip verification step (step 4)
nextStep(); // Go directly to prompts (step 5)
return;
```

**With this:**

```typescript
console.log("➡️  [Frontend] Moving to next step (verification)");
nextStep(); // Go to verification step
return;
```

**Uncomment the email rate limit handling** (lines 156-175)

### Step 3: Update Backend Comments

#### In `app/api/auth/signup/route.ts` (lines 69-73)

Remove or update the MVP comment. The code is already correct, just update docs.

### Step 4: Test

1. Create a new account
2. You should receive a verification email
3. Enter the OTP code in Step 4
4. Continue to prompts (Step 5)

## Why This Approach?

✅ **Clean**: All code is preserved, just disabled
✅ **Fast**: Easy to re-enable (15 minutes max)
✅ **Safe**: No code deletions, no git history mess
✅ **MVP-friendly**: Faster user onboarding for testing

## Notes

- Step 4 (Verification) component still exists and works
- The `StepVerification` component is fully functional
- Email sending infrastructure is ready (Supabase SMTP)
- Just need to flip the switches when ready for production

---

**Last Updated**: October 24, 2025
**Status**: Email verification **DISABLED** for MVP
**Re-enable when**: Ready for production launch
