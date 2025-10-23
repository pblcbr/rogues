# Stripe Integration Setup

This guide explains how to configure Stripe payments for the Rogues platform.

## Prerequisites

- Stripe account created
- Access to Stripe Dashboard
- Price IDs already created in Stripe

## Price IDs Configuration

The following Price IDs are configured in the platform:

### Production Prices

- **Starter Plan**: `price_1SLSzGLlfnJ045i4EQxm8k8X`
  - $99/month
  - No trial period
  - 50 unique prompts, 1 engine, 1 seat

- **Growth Plan**: `price_1SLSzULlfnJ045i472fRK92l`
  - $399/month
  - 7-day free trial
  - 100 unique prompts, 3 engines, 3 seats, 6 articles/month

## Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # or pk_live_... for production
STRIPE_SECRET_KEY=sk_test_...                    # or sk_live_... for production
NEXT_PUBLIC_APP_URL=http://localhost:3000        # Your app URL
```

### Where to find these keys:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **API keys**
3. Copy:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY` (⚠️ Keep this secret!)

## Verifying Price IDs in Stripe Dashboard

To verify your Price IDs are correctly configured:

1. Go to [Stripe Products](https://dashboard.stripe.com/products)
2. Find your "Starter" and "Growth" products
3. Click on each product
4. Verify the Price ID matches what's configured in `lib/stripe/plans.ts`

### Expected Configuration:

#### Starter Plan

- **Price ID**: `price_1SLSzGLlfnJ045i4EQxm8k8X`
- **Amount**: $99.00 USD
- **Billing period**: Monthly
- **Trial**: None

#### Growth Plan

- **Price ID**: `price_1SLSzULlfnJ045i472fRK92l`
- **Amount**: $399.00 USD
- **Billing period**: Monthly
- **Trial**: 7 days (should be configured in Stripe)

## Testing the Integration

### 1. Test Mode

For testing, use Stripe's test mode:

- Use test API keys (starting with `pk_test_` and `sk_test_`)
- Use test card numbers: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

### 2. Test the Checkout Flow

1. Start the registration process
2. Complete steps 1-5
3. Select a plan (Starter or Growth)
4. Click "Purchase Plan" or "Try Free for 7 Days"
5. You should be redirected to Stripe Checkout
6. Complete the payment with test card
7. Verify redirect back to your app

### 3. Verify Webhook Events

After a successful test:

1. Go to Stripe Dashboard → **Developers** → **Events**
2. Look for these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.trial_will_end` (for Growth plan)

## Setting Up Webhooks (Recommended)

To receive real-time updates about subscriptions:

### 1. Create Webhook Endpoint

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 2. Add Webhook Secret to Environment

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Create Webhook Handler

The webhook handler is needed to:

- Activate subscriptions after successful payment
- Handle trial expiration
- Manage subscription cancellations
- Process failed payments

## File Structure

The Stripe integration is organized as follows:

```
lib/stripe/
├── client.ts           # Stripe client initialization
└── plans.ts            # Pricing plans configuration with Price IDs

app/api/stripe/
└── create-checkout/
    └── route.ts        # Checkout session creation endpoint

components/auth/registration-wizard/
├── step-pricing.tsx    # Plan selection UI
└── step-payment.tsx    # Payment processing
```

## Customizing Plans

To modify plan features or pricing:

1. **Update in Stripe Dashboard**:
   - Go to Products
   - Edit product/price details
   - Note: You cannot edit existing prices, create new ones instead

2. **Update in Code**:
   ```typescript
   // lib/stripe/plans.ts
   export const PLANS: Record<string, PricingPlan> = {
     starter: {
       id: "starter",
       price: 99,
       stripePriceId: "price_1SLSzGLlfnJ045i4EQxm8k8X",
       // Update features and limits as needed
     },
   };
   ```

## Common Issues

### 1. "Invalid API Key"

- Check that you're using the correct environment keys (test vs live)
- Verify keys are correctly set in `.env.local`
- Restart your Next.js dev server after changing env vars

### 2. "No such price"

- Verify Price IDs match exactly (case-sensitive)
- Check that you're using the correct Stripe account
- Ensure test/live mode matches between dashboard and code

### 3. Checkout session fails to create

- Check server logs for specific error
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Ensure user is authenticated before creating checkout

### 4. Trial period not working

- Verify trial is configured on the Price in Stripe Dashboard
- Check that `trialDays` is set in `plans.ts`
- Trial periods are only valid for recurring prices

## Security Best Practices

1. **Never expose Secret Key**: Only use on server-side
2. **Validate webhooks**: Always verify webhook signatures
3. **Use HTTPS**: Required for production webhooks
4. **Store customer IDs**: Save Stripe Customer ID in your database
5. **Handle errors gracefully**: Show user-friendly error messages

## Going Live

Before going to production:

1. ✅ Test all payment flows thoroughly
2. ✅ Set up webhook endpoints
3. ✅ Switch to live API keys
4. ✅ Verify Price IDs are for live products
5. ✅ Configure proper success/cancel URLs
6. ✅ Set up proper error monitoring
7. ✅ Review Stripe's compliance requirements
8. ✅ Enable Stripe Radar for fraud prevention

## Monitoring

### Important Metrics to Track

- Successful checkouts
- Failed payments
- Trial conversions
- Subscription cancellations
- Revenue

### Stripe Dashboard Views

- **Home**: Overview of revenue and activity
- **Payments**: All successful payments
- **Subscriptions**: Active subscriptions
- **Customers**: Customer database
- **Reports**: Revenue analytics

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Testing Guide](https://stripe.com/docs/testing)

## Next Steps

After configuring Stripe:

1. [ ] Set up webhook handler for subscription events
2. [ ] Implement subscription management in user dashboard
3. [ ] Add payment method update functionality
4. [ ] Create billing history page
5. [ ] Implement invoice downloads
6. [ ] Set up email notifications for payment events
7. [ ] Add grace period handling for failed payments
8. [ ] Configure dunning emails in Stripe Dashboard
