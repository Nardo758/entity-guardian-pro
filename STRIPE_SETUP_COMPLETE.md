# Complete Stripe Subscription Setup Guide

## Overview
This guide will help you configure Stripe for your Entity Renewal Pro subscription system from scratch.

## Subscription Tiers (Now Configured)

| Tier | Monthly | Yearly | Entities | Lookup Keys |
|------|---------|--------|----------|-------------|
| **Starter** | $19/mo | $191/yr | 4 | `erp:starter:monthly`, `erp:starter:yearly` |
| **Growth** | $49/mo | $492/yr | 20 | `erp:growth:monthly`, `erp:growth:yearly` |
| **Professional** | $99/mo | $994/yr | 50 | `erp:professional:monthly`, `erp:professional:yearly` |
| **Enterprise** | $249/mo | $2500/yr | 150 | `erp:enterprise:monthly`, `erp:enterprise:yearly` |

---

## Step 1: Get Stripe API Keys

### Test Mode (for development):
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** (starts with `pk_test_...`)
3. Click "Reveal test key" and copy **Secret key** (starts with `sk_test_...`)

### Live Mode (for production):
1. Go to https://dashboard.stripe.com/apikeys
2. Copy **Publishable key** (starts with `pk_live_...`)
3. Click "Reveal live key" and copy **Secret key** (starts with `sk_live_...`)

---

## Step 2: Configure Environment Variables

### In Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/settings/secrets
2. Add these secrets:

```bash
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET  # (Get this in Step 4)
```

### In Your Local .env File:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
```

---

## Step 3: Sync Pricing to Stripe

This creates products and prices in your Stripe account that match your subscription tiers.

### Using curl:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/sync-pricing \
  -H "Content-Type: application/json"
```

### Expected Response:
```json
{
  "ok": true,
  "results": {
    "starter": {
      "productId": "prod_...",
      "monthlyPriceId": "price_...",
      "yearlyPriceId": "price_..."
    },
    "growth": { ... },
    "professional": { ... },
    "enterprise": { ... }
  }
}
```

### Verify in Stripe Dashboard:
1. Go to https://dashboard.stripe.com/test/products
2. You should see 4 products:
   - Entity Renewal Pro - Starter
   - Entity Renewal Pro - Growth
   - Entity Renewal Pro - Professional
   - Entity Renewal Pro - Enterprise
3. Each product should have 2 prices (monthly and yearly)

---

## Step 4: Configure Stripe Webhooks

Webhooks allow Stripe to notify your app about subscription events (payments, cancellations, etc.)

### Option A: Local Development (using Stripe CLI)

1. **Install Stripe CLI:**
   ```bash
   # Windows (using Scoop)
   scoop install stripe
   
   # macOS
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local function:**
   ```bash
   stripe listen --forward-to https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook
   ```

4. **Copy the webhook signing secret** (starts with `whsec_...`)
5. **Add to Supabase secrets:**
   ```bash
   STRIPE_CLI_WEBHOOK_SECRET=whsec_YOUR_CLI_SECRET
   ```

### Option B: Production/Staging (using Stripe Dashboard)

1. **Go to Stripe Webhook Settings:**
   - Test mode: https://dashboard.stripe.com/test/webhooks
   - Live mode: https://dashboard.stripe.com/webhooks

2. **Click "+ Add endpoint"**

3. **Enter endpoint URL:**
   ```
   https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook
   ```

4. **Select events to listen for:**
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

5. **Click "Add endpoint"**

6. **Copy the Signing secret** (click "Reveal" next to "Signing secret")

7. **Add to Supabase project secrets:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
   ```

---

## Step 5: Update Stripe Config Function

The `get-stripe-config` edge function needs to return your Stripe publishable key.

### Update the function:

```typescript
// supabase/functions/get-stripe-config/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Return the publishable key - this is safe to expose client-side
    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");
    
    if (!publishableKey) {
      throw new Error("STRIPE_PUBLISHABLE_KEY not configured");
    }

    return new Response(
      JSON.stringify({ publishableKey }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
```

### Add the publishable key to Supabase secrets:
```bash
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
```

---

## Step 6: Test the Subscription Flow

### 1. Test Checkout Creation:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-checkout \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"tier":"growth","billing":"monthly"}'
```

Expected response:
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "id": "cs_test_..."
}
```

### 2. Test Payment with Stripe Test Cards:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Declined payment |
| `4000 0000 0000 9995` | Insufficient funds |

- Use any future expiry date (e.g., 12/25)
- Use any 3-digit CVC (e.g., 123)
- Use any valid ZIP code (e.g., 12345)

### 3. Verify Subscription Status:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/check-subscription \
  -H "Authorization: Bearer YOUR_USER_JWT"
```

Expected response:
```json
{
  "subscribed": true,
  "subscription_tier": "Growth",
  "subscription_end": "2025-12-06T..."
}
```

---

## Step 7: Database Schema Verification

Ensure your `subscribers` table has the correct schema:

```sql
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT CHECK (subscription_tier IN ('Starter', 'Growth', 'Professional', 'Enterprise')),
  subscription_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer ON subscribers(stripe_customer_id);
```

---

## Step 8: Customer Portal (for subscription management)

Users can manage their subscriptions via Stripe Customer Portal:

### Test the portal function:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/customer-portal \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

---

## Common Issues & Solutions

### Issue 1: "Price not found for lookup_key"
**Solution:** Run the `sync-pricing` function again to create products/prices.

### Issue 2: "Invalid webhook signature"
**Solution:** 
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly in Supabase secrets
- For local development, use Stripe CLI and set `STRIPE_CLI_WEBHOOK_SECRET`

### Issue 3: "User not authenticated"
**Solution:** Make sure you're passing a valid JWT token in the `Authorization` header.

### Issue 4: Checkout redirects to external page instead of modal
**Solution:** The CheckoutModal component should be used instead of redirect. Check your Billing.tsx implementation.

### Issue 5: Subscription status not updating after payment
**Solution:** 
- Check webhook logs in Stripe Dashboard
- Verify webhook secret is correct
- Check Supabase function logs for errors

---

## Monitoring & Debugging

### View Stripe Webhook Logs:
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. View "Recent deliveries" section

### View Supabase Function Logs:
1. Go to Supabase Dashboard → Functions
2. Click on function name
3. View logs tab

### Test Webhook Delivery:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook-send-test
```

---

## Production Checklist

Before going live:

- [ ] Switch from test keys (`sk_test_...`, `pk_test_...`) to live keys (`sk_live_...`, `pk_live_...`)
- [ ] Run `sync-pricing` with live keys to create products in live mode
- [ ] Configure production webhook endpoint in live Stripe dashboard
- [ ] Update `STRIPE_WEBHOOK_SECRET` with live webhook secret
- [ ] Test complete subscription flow with real card (then cancel/refund)
- [ ] Set up Stripe billing alerts and monitoring
- [ ] Configure email receipts in Stripe Dashboard → Settings → Emails
- [ ] Review Stripe tax settings if applicable
- [ ] Test subscription cancellation and renewal flows

---

## Files Modified in This Update

### Edge Functions Updated:
✅ `supabase/functions/sync-pricing/index.ts` - Updated tiers from 4 to match frontend
✅ `supabase/functions/create-checkout/index.ts` - Added 'growth' tier support
✅ `supabase/functions/stripe-webhook/index.ts` - Added 'growth' tier handling
✅ `supabase/functions/check-subscription/index.ts` - Added 'growth' tier mapping
✅ `supabase/functions/create-paid-registration/index.ts` - Updated valid tiers
✅ `supabase/functions/stripe-webhook-simulate/index.ts` - Added 'growth' tier

### Frontend Files (Already Correct):
✅ `src/lib/stripe.ts` - Defines correct pricing tiers
✅ `src/components/payment/CheckoutModal.tsx` - Modal-based checkout
✅ `src/components/payment/PlanSelector.tsx` - Tier selection UI

---

## Support Resources

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe API Docs:** https://stripe.com/docs/api
- **Stripe Test Cards:** https://stripe.com/docs/testing
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Project Functions:** https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/functions

---

## Next Steps

1. **Configure Stripe keys** in Supabase secrets (Step 2)
2. **Run sync-pricing** to create products/prices (Step 3)
3. **Set up webhooks** for event handling (Step 4)
4. **Test subscription flow** end-to-end (Step 6)
5. **Deploy and monitor** in production (Step 8)

Your Stripe subscription system is now configured and ready to use! 🎉
