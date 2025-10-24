# OpenAI API Configuration Guide

This guide explains how to configure OpenAI API for AI-powered prompt generation in the Rogues platform.

## Why OpenAI?

The registration wizard uses OpenAI's GPT-4o model to analyze a company's domain and generate personalized monitoring prompts. These prompts are tailored to:

- The company's industry and offerings
- Potential customer use cases
- Competitive positioning
- Search intent and query types

**Without OpenAI configured**: The system will use generic fallback prompts that work for any business but are not personalized.

## Prerequisites

- OpenAI account
- Credit card on file (OpenAI requires payment method)
- Approximately $0.01-0.05 per prompt generation request

## Step 1: Create OpenAI Account

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to [Billing](https://platform.openai.com/account/billing) and add a payment method
4. Add at least $5 in credits to your account

## Step 2: Generate API Key

1. Go to [API Keys](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Give it a name (e.g., "Rogues Development")
4. Copy the key immediately (it will only be shown once)
5. Save it securely

The key will look like: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 3: Add to Environment Variables

1. In your project root, create or edit `.env.local`:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

2. **Important**: Never commit `.env.local` to git. It's already in `.gitignore`

3. Restart your Next.js development server:

```bash
npm run dev
```

## Step 4: Test the Configuration

1. Start the registration process
2. When you reach the "Prompts" step, you should see personalized prompts
3. Check the server console for logs:
   - ✅ `[OpenAI] Generating prompts for domain: example.com`
   - ✅ `[OpenAI] Successfully generated 10 prompts`
   - ❌ `[OpenAI] API key not configured. Using fallback prompts.`

## Troubleshooting

### Issue: "Using generic prompts" message appears

**Cause**: API key is not configured or invalid

**Solution**:

1. Verify `.env.local` exists in project root
2. Check the API key is correct (starts with `sk-proj-` or `sk-`)
3. Ensure no extra spaces or quotes around the key
4. Restart the development server

### Issue: "Insufficient quota" error

**Cause**: No credits on OpenAI account

**Solution**:

1. Go to [OpenAI Billing](https://platform.openai.com/account/billing)
2. Add credits to your account
3. Try again after a few minutes

### Issue: "Rate limit exceeded"

**Cause**: Too many requests in a short time

**Solution**:

1. Wait 60 seconds
2. OpenAI free tier has rate limits
3. Consider upgrading to pay-as-you-go

### Issue: "Invalid API key"

**Cause**: Wrong or expired API key

**Solution**:

1. Generate a new API key
2. Replace the old key in `.env.local`
3. Restart the server

## Cost Estimation

Using GPT-4o for prompt generation:

- **Model**: `gpt-4o` (most capable, recommended)
- **Input tokens**: ~300 tokens per request
- **Output tokens**: ~500 tokens per request
- **Cost per request**: ~$0.01-0.02
- **Monthly cost** (100 users/day): ~$30-60

### Cost Optimization

1. **Use fallback prompts**: For development/testing
2. **Cache prompts**: Store generated prompts per domain
3. **Rate limiting**: Prevent abuse
4. **Batch processing**: Generate for multiple users at once

## Production Recommendations

### 1. Use Separate Keys for Environments

```bash
# .env.local (Development)
OPENAI_API_KEY=sk-proj-dev-key

# Production environment variables
OPENAI_API_KEY=sk-proj-prod-key
```

### 2. Monitor Usage

- Set up [usage alerts](https://platform.openai.com/account/limits) in OpenAI Dashboard
- Track costs per user/request
- Set hard limits to prevent unexpected bills

### 3. Implement Caching

```typescript
// Example: Cache prompts by domain
const cachedPrompts = await redis.get(`prompts:${domain}`);
if (cachedPrompts) {
  return JSON.parse(cachedPrompts);
}

const prompts = await generatePromptsForDomain(domain);
await redis.set(`prompts:${domain}`, JSON.stringify(prompts), "EX", 86400); // 24h cache
```

### 4. Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// Example with Upstash Rate Limit
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"),
});

const { success } = await ratelimit.limit(email);
if (!success) {
  return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
}
```

### 5. Error Handling

The system automatically falls back to generic prompts if OpenAI fails. Monitor errors:

```typescript
// Check server logs for:
[OpenAI] Error generating prompts: ...
[OpenAI] Returning fallback prompts
```

## Alternative: Use Fallback Prompts Only

If you don't want to use OpenAI:

1. **Don't set** `OPENAI_API_KEY` in `.env.local`
2. The system will automatically use generic fallback prompts
3. Users will see: "Using generic prompts"
4. No API costs incurred

The fallback prompts are high-quality and work for most businesses, they're just not personalized.

## Security Best Practices

1. **Never expose API keys**: Keep them server-side only
2. **Rotate keys regularly**: Generate new keys every 90 days
3. **Use environment variables**: Never hardcode keys
4. **Monitor for suspicious activity**: Check OpenAI usage logs
5. **Set spending limits**: Prevent unexpected bills

## Environment Variables Summary

Add these to your `.env.local`:

```bash
# Required for AI-powered prompt generation
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Optional: Override model (default: gpt-4o)
OPENAI_MODEL=gpt-4o

# Optional: Max tokens for generation (default: 2000)
OPENAI_MAX_TOKENS=2000
```

## Testing Without OpenAI

For local development without costs:

1. Don't configure `OPENAI_API_KEY`
2. Fallback prompts will be used automatically
3. Test the full registration flow
4. Add OpenAI when ready for production

## Support

- [OpenAI Documentation](https://platform.openai.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [OpenAI Community Forum](https://community.openai.com/)
- [Pricing Calculator](https://openai.com/pricing)

## Related Files

- `/lib/openai/client.ts` - OpenAI client configuration
- `/lib/openai/prompt-generator.ts` - Prompt generation logic
- `/app/api/prompts/generate/route.ts` - API endpoint
- `/components/auth/registration-wizard/step-prompts.tsx` - UI component

## Next Steps

After configuring OpenAI:

1. Test the registration flow
2. Monitor costs in OpenAI Dashboard
3. Implement caching for production
4. Set up usage alerts
5. Consider rate limiting

---

**Note**: OpenAI integration is optional. The platform works perfectly fine with fallback prompts if you prefer not to use OpenAI or want to save costs during development.
