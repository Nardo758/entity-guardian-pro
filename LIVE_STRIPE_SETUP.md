# ⚠️ LIVE Stripe Configuration

You're using **LIVE** Stripe keys! This means real payments will be processed.

## Your Keys

**Publishable Key (Frontend):**
```
pk_live_YOUR_PUBLISHABLE_KEY
```
(Check your .env file for the actual key)

**Secret Key (Backend - Required):**
You need to get this from: https://dashboard.stripe.com/apikeys
- It will start with `sk_live_...`
- Click "Reveal live key token" to see it

## Required Supabase Secrets

Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/secrets

Add/verify these secrets:

```bash
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
```

## ⚠️ Important: Live Mode Considerations

Since you're using **live keys**, please be aware:

### 1. Real Payments Will Be Charged
- Test cards won't work
- Real credit cards will be charged real money
- You'll need to refund any test payments

### 2. Webhook Configuration
You need a **live webhook** endpoint configured in Stripe:
1. Go to: https://dashboard.stripe.com/webhooks (NOT test mode)
2. Add endpoint: `https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the **live webhook secret** (starts with `whsec_...`)
5. Add to Supabase secrets as: `STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET`

### 3. Stripe Account Requirements
For live mode, you need:
- ✅ Verified business information
- ✅ Bank account connected for payouts
- ✅ Tax settings configured (if applicable)
- ✅ Email receipts configured

## 🧪 Recommendation: Test Mode First

**Consider using test mode first** to verify everything works:

### Test Mode Keys (Recommended for initial setup):
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Get test keys (start with `sk_test_...` and `pk_test_...`)
3. Use these in Supabase secrets first
4. Test the complete flow with test cards
5. **Then** switch to live keys once verified

### Test Cards (for test mode):
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future expiry, any CVC

## Current Setup Steps

### Step 1: Add Secret Key to Supabase
```bash
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
```

### Step 2: Update Frontend .env
```bash
# Add to your .env file:
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
```

### Step 3: Run Sync-Pricing
Open `test-stripe-sync.html` in browser and click "Sync Pricing"

This will create **LIVE products** in your Stripe account with real prices.

### Step 4: Configure Live Webhook
See "Webhook Configuration" section above.

### Step 5: Test with Real Card
Use a real credit card (then immediately refund the payment in Stripe Dashboard).

## ⚠️ Production Checklist

Before going fully live:

- [ ] Business information verified in Stripe
- [ ] Bank account connected
- [ ] Tax settings configured
- [ ] Webhook endpoint configured (LIVE mode)
- [ ] Email receipts enabled
- [ ] Subscription flow tested end-to-end
- [ ] Refund policy documented
- [ ] Terms of service updated
- [ ] Privacy policy updated
- [ ] Customer support email configured

## 🆘 If You Want to Use Test Mode Instead

1. Go to Stripe Dashboard and toggle to "Test mode" (top right)
2. Get test keys from: https://dashboard.stripe.com/test/apikeys
3. Update Supabase secrets with `sk_test_...` key
4. Update .env with `pk_test_...` key
5. Run sync-pricing again (creates test products)
6. Test with card `4242 4242 4242 4242`
7. Once working, switch back to live keys

---

**Next Step:** Get your live secret key from Stripe Dashboard and add it to Supabase secrets, then run the sync-pricing function.
