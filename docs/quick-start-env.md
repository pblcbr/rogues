# Quick Start: Environment Setup

This guide will help you get all environment variables configured for the tacmind platform.

## Create Your .env.local File

Create a file named `.env.local` in the project root with the following content:

```bash
# ============================================
# SUPABASE (Required)
# ============================================
# Get these from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# APP CONFIGURATION (Required)
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# OPENAI (Optional - for AI-powered prompts)
# ============================================
# Get your key from: https://platform.openai.com/api-keys
# Leave empty to use generic fallback prompts (works fine!)
OPENAI_API_KEY=sk-proj-your-key-here

# ============================================
# STRIPE (Required for payments)
# ============================================
# Get these from: https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs - Create products in Stripe Dashboard first
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

## Step-by-Step Configuration

### 1. Supabase (Required) ⭐

**Time**: 5 minutes

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project (or use existing)
3. Go to **Settings** → **API**
4. Copy the values:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

📖 **Detailed guide**: See `/docs/supabase-integration.md`

### 2. OpenAI (Optional) ⚡

**Time**: 3 minutes  
**Cost**: ~$0.01 per user registration

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Copy the key → `OPENAI_API_KEY`
4. Add credits to your account (minimum $5)

**Skip this if**:

- You're just testing locally
- You want to save costs
- Generic prompts are fine for now

📖 **Detailed guide**: See `/docs/openai-setup.md`

### 3. Stripe (Required for paid plans) 💳

**Time**: 10 minutes

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get API keys from **Developers** → **API keys**:
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`
3. Create products with prices (see stripe-setup.md)
4. Copy price IDs

📖 **Detailed guide**: See `/docs/stripe-setup.md`

## Verify Your Setup

### Check Required Variables

Run this in your terminal:

```bash
# Check if .env.local exists
ls -la .env.local

# Verify variables are loaded (without showing values)
npm run dev 2>&1 | grep -i "missing\|error\|env"
```

### Test Each Service

**Supabase**:

1. Start the dev server: `npm run dev`
2. Go to `/register`
3. Enter an email - if no errors, Supabase is working ✅

**OpenAI**:

1. Complete registration steps 1-4
2. At step 5 (Prompts), check for:
   - ✅ Personalized prompts → OpenAI is working
   - ⚠️ "Using generic prompts" → OpenAI not configured (that's OK!)

**Stripe**:

1. Reach the payment step
2. Should see Stripe checkout
3. Use test card: `4242 4242 4242 4242`

## Common Issues

### "Missing Supabase environment variables"

**Fix**: Ensure `.env.local` is in the project root, not in a subfolder

```bash
# Should be here:
/rogues/.env.local

# NOT here:
/rogues/app/.env.local
```

### "OPENAI_API_KEY is not defined"

**This is OK!** The app works without OpenAI. If you see "Using generic prompts", everything is working.

To fix (optional):

1. Add `OPENAI_API_KEY=sk-proj-xxx` to `.env.local`
2. Restart the server

### Server doesn't pick up changes

**Fix**: Restart the development server after editing `.env.local`

```bash
# Stop with Ctrl+C, then:
npm run dev
```

### Stripe checkout not loading

**Fix**: Verify both Stripe keys are correct:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_`)
- `STRIPE_SECRET_KEY` (starts with `sk_`)

## Minimum Required Setup

To run the app locally with basic functionality:

```bash
# .env.local - Minimum configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional (can skip for testing)
# OPENAI_API_KEY=sk-proj-...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_SECRET_KEY=sk_test_...
```

This allows:

- ✅ User registration and authentication
- ✅ Email verification
- ✅ Prompt generation (with fallback prompts)
- ❌ Payments (need Stripe)

## Security Checklist

Before deploying to production:

- [ ] `.env.local` is in `.gitignore`
- [ ] Never commit API keys to git
- [ ] Use different keys for dev/staging/production
- [ ] Rotate keys every 90 days
- [ ] Set up Stripe webhooks for production
- [ ] Configure SMTP for production emails
- [ ] Enable Supabase RLS policies

## Environment Variables Reference

| Variable                             | Required        | Service  | Description                     |
| ------------------------------------ | --------------- | -------- | ------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | ✅ Yes          | Supabase | Your Supabase project URL       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | ✅ Yes          | Supabase | Public anon key for client      |
| `SUPABASE_SERVICE_ROLE_KEY`          | ✅ Yes          | Supabase | Service role key (keep secret!) |
| `NEXT_PUBLIC_APP_URL`                | ✅ Yes          | App      | Your app URL (for redirects)    |
| `OPENAI_API_KEY`                     | ❌ No           | OpenAI   | For AI-powered prompts          |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚠️ For payments | Stripe   | Public Stripe key               |
| `STRIPE_SECRET_KEY`                  | ⚠️ For payments | Stripe   | Secret Stripe key               |
| `STRIPE_WEBHOOK_SECRET`              | ⚠️ For payments | Stripe   | Webhook signing secret          |
| `STRIPE_*_PRICE_ID`                  | ⚠️ For payments | Stripe   | Price IDs for plans             |

## Next Steps

1. ✅ Configure environment variables
2. ✅ Run database migrations (see `lib/supabase/schema.sql`)
3. ✅ Configure SMTP for emails (see `docs/supabase-smtp-setup.md`)
4. ✅ Test the full registration flow
5. ✅ Set up Stripe products and prices
6. ✅ Deploy to production (Vercel recommended)

## Getting Help

If you're stuck:

1. Check the console for specific error messages
2. Review detailed docs in `/docs/` folder:
   - `supabase-integration.md`
   - `openai-setup.md`
   - `stripe-setup.md`
3. Use the debug tool at `/debug-registration` for auth issues

## Production Deployment

When deploying to Vercel/production:

1. Add all environment variables in your hosting dashboard
2. Update `NEXT_PUBLIC_APP_URL` to your production domain
3. Use production API keys (not test keys)
4. Set up Stripe webhooks pointing to your domain
5. Configure production SMTP settings in Supabase

---

**Quick tip**: Start with just Supabase configured. You can add OpenAI and Stripe later as needed!
