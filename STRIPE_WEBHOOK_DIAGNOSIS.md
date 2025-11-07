# 🔍 Stripe Webhook Diagnosis Report

**Date:** November 7, 2025  
**Issue:** Test webhook events not showing results on either Stripe or Supabase side

---

## 🚨 Critical Issues Found

### 1. **Webhook Function Is NOT Using Database Schema** ❌

**Problem:** Your webhook function (`supabase/functions/stripe-webhook/index.ts`) is using a **simplified, outdated approach** that doesn't leverage the comprehensive database schema you created.

**Current Code Issues:**
- ✗ Does NOT call `update_subscriber_from_webhook()` function
- ✗ Does NOT log events to `stripe_events` table
- ✗ Does NOT create records in `stripe_invoices` table
- ✗ Only handles 2 event types (checkout.session.completed, invoice.payment_succeeded)
- ✗ Missing critical subscription lifecycle events
- ✗ No structured error logging

**What Should Happen:**
```typescript
// Should be calling the database function you created:
await supabase.rpc('log_stripe_event', {
  p_stripe_event_id: event.id,
  p_event_type: event.type,
  p_event_data: event
});

await supabase.rpc('update_subscriber_from_webhook', {
  p_stripe_customer_id: customerId,
  p_stripe_subscription_id: subscriptionId,
  // ... other params
});
```

**What's Actually Happening:**
```typescript
// Current code just does basic upserts:
await supabase.from('subscribers').upsert({
  email: customerEmail,
  stripe_customer_id: customerId,
  // ... missing most fields
});
```

---

### 2. **Migration May Not Be Applied** ⚠️

**Problem:** The comprehensive migration file exists but may not have been applied to your database.

**Migration Creates:**
- ✓ `stripe_events` table (for webhook event logging)
- ✓ `stripe_invoices` table (for invoice tracking)
- ✓ `subscription_history` table (for audit trail)
- ✓ `update_subscriber_from_webhook()` function
- ✓ `log_stripe_event()` function
- ✓ `mark_event_processed()` function
- ✓ Multiple indexes and triggers

**How to Verify:**
Run the test tool I created: `test-stripe-webhook.html`

**How to Apply:**
```powershell
cd supabase
supabase db push
```

---

### 3. **Missing Environment Variables** ⚠️

**Required Secrets in Supabase:**
- `STRIPE_SECRET_KEY` - Backend API key (sk_live_... or sk_test_...)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (whsec_...)
- `STRIPE_PUBLISHABLE_KEY` - Frontend key (pk_live_... or pk_test_...)

**Check Status:**
```powershell
# Use the diagnostic tool
node diagnose-stripe.js

# Or open browser tool
# test-stripe-webhook.html
```

---

### 4. **Webhook Not Registered in Stripe Dashboard** ❌

**Problem:** Even if the webhook endpoint works, Stripe won't send events unless you register it.

**Required Setup:**
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen to (see list below)
5. Copy the webhook signing secret (whsec_...)
6. Add to Supabase: `STRIPE_WEBHOOK_SECRET=whsec_...`

**Required Events:**
```
✓ checkout.session.completed
✓ customer.subscription.created
✓ customer.subscription.updated
✓ customer.subscription.deleted
✓ customer.subscription.trial_will_end
✓ invoice.payment_succeeded
✓ invoice.payment_failed
✓ invoice.finalized
✓ payment_intent.succeeded
✓ payment_intent.payment_failed
```

---

## 🔧 How to Fix

### Step 1: Apply Database Migration

```powershell
cd "C:\Users\Leon\Documents\Apartment-Locator-AI-Real-main\Apartment-Locator-AI-Scraper-Agent-Real\entity-guardian-pro"

# Apply the migration
cd supabase
supabase db push

# Or if you need to apply remotely
supabase db push --db-url "your-connection-string"
```

### Step 2: Update Webhook Function

Replace `supabase/functions/stripe-webhook/index.ts` with the proper implementation that uses your database schema.

**Key Changes Needed:**
1. Log all events to `stripe_events` table
2. Call `update_subscriber_from_webhook()` for subscription events
3. Create invoice records in `stripe_invoices` table
4. Handle all subscription lifecycle events
5. Mark events as processed
6. Better error handling and logging

### Step 3: Set Environment Variables

```powershell
# Get your Stripe keys from: https://dashboard.stripe.com/apikeys
# Then add them to Supabase project secrets

# Via Supabase Dashboard:
# https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/settings/secrets

# Add these secrets:
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET  # (Get this in Step 4)
```

### Step 4: Register Webhook in Stripe

1. **Open Stripe Dashboard:**
   https://dashboard.stripe.com/webhooks

2. **Add Endpoint:**
   - URL: `https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook`
   - Description: "Supabase Webhook Handler"
   - Events: Select all subscription and payment events

3. **Copy Signing Secret:**
   - After creating, click "Reveal signing secret"
   - Copy the `whsec_...` value
   - Add to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

4. **Test Webhook:**
   - In Stripe Dashboard, click "Send test webhook"
   - Choose event: `checkout.session.completed`
   - Click "Send test webhook"
   - Check Supabase logs for processing

### Step 5: Redeploy Webhook Function

```powershell
cd supabase/functions
supabase functions deploy stripe-webhook
```

---

## 🧪 Testing Tools

I've created diagnostic tools to help you:

### 1. **test-stripe-webhook.html** (NEW!)
- Browser-based webhook diagnostics
- Tests endpoint accessibility
- Checks database tables
- Verifies Supabase secrets
- Simulates webhook events

**Usage:**
```powershell
# Open in browser
start test-stripe-webhook.html
```

### 2. **diagnose-stripe.js** (Existing)
- Node.js diagnostic script
- Tests Stripe configuration
- Checks edge functions

**Usage:**
```powershell
node diagnose-stripe.js
```

### 3. **test-stripe-sync.html** (Existing)
- Syncs products to Stripe
- Creates price IDs

---

## 📊 What's Missing in Your Current Setup

| Component | Status | Action Needed |
|-----------|--------|---------------|
| Database Schema | ✅ Created | Apply migration |
| Database Tables | ⚠️ Unknown | Run `supabase db push` |
| Webhook Function | ❌ Incomplete | Update code to use schema |
| Stripe Secrets | ⚠️ Partial | Add STRIPE_WEBHOOK_SECRET |
| Webhook Registration | ❌ Missing | Register in Stripe Dashboard |
| Event Logging | ❌ Not Working | Fix webhook function |

---

## 🎯 Why Events Aren't Showing Up

### On Stripe Side:
- **Issue:** Webhook not registered in Stripe Dashboard
- **Result:** Stripe has nowhere to send events
- **Fix:** Register webhook endpoint (Step 4 above)

### On Supabase Side:
- **Issue 1:** Migration not applied → tables don't exist
- **Issue 2:** Webhook function doesn't log events → no records created
- **Result:** Even if events arrive, they're not stored
- **Fix:** Apply migration + update webhook function

---

## 🚀 Quick Start Checklist

Follow these steps in order:

```
☐ 1. Apply database migration
     → cd supabase && supabase db push

☐ 2. Verify tables exist
     → Open test-stripe-webhook.html
     → Run "Check Database Tables"

☐ 3. Check Supabase secrets
     → https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/settings/secrets
     → Verify STRIPE_SECRET_KEY exists
     → Verify STRIPE_PUBLISHABLE_KEY exists

☐ 4. Register webhook in Stripe
     → https://dashboard.stripe.com/webhooks
     → Add endpoint with URL above
     → Copy signing secret (whsec_...)

☐ 5. Add webhook secret to Supabase
     → Add STRIPE_WEBHOOK_SECRET=whsec_...

☐ 6. Update webhook function code
     → Use database functions properly
     → Log all events to stripe_events table

☐ 7. Redeploy webhook function
     → supabase functions deploy stripe-webhook

☐ 8. Test with Stripe Dashboard
     → Send test event from Stripe
     → Check Supabase logs
     → Query stripe_events table
```

---

## 📝 Expected Database Structure After Fix

### stripe_events Table
```sql
SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 5;

-- Should show:
id | stripe_event_id | event_type | processed | created_at
---|-----------------|------------|-----------|------------
... | evt_xxx        | checkout.session.completed | true | 2025-11-07 ...
```

### subscribers Table
```sql
SELECT 
  email, 
  subscription_tier, 
  subscription_status, 
  stripe_subscription_id,
  current_period_end
FROM subscribers 
WHERE stripe_customer_id IS NOT NULL;

-- Should show:
email | subscription_tier | subscription_status | stripe_subscription_id | current_period_end
------|-------------------|---------------------|------------------------|-------------------
user@example.com | growth | active | sub_xxx | 2025-12-07
```

### stripe_invoices Table
```sql
SELECT * FROM stripe_invoices ORDER BY created_at DESC LIMIT 5;

-- Should show invoice records when payments succeed
```

---

## 🔗 Useful Links

- **Supabase Project:** https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp
- **Supabase Secrets:** https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/settings/secrets
- **Supabase Logs:** https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/logs/edge-functions
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Webhooks:** https://dashboard.stripe.com/webhooks
- **Stripe API Keys:** https://dashboard.stripe.com/apikeys
- **Stripe Events Log:** https://dashboard.stripe.com/logs

---

## 💡 Pro Tips

1. **Always check logs:**
   - Supabase: Function logs show errors
   - Stripe: Event logs show delivery status

2. **Test incrementally:**
   - First verify endpoint responds (OPTIONS request)
   - Then verify signature validation works
   - Then verify database writes work
   - Finally test full flow

3. **Use test mode first:**
   - Use `sk_test_...` keys initially
   - Switch to `sk_live_...` only when working

4. **Monitor webhook health:**
   - Stripe shows delivery success rate
   - Disable unhealthy endpoints automatically
   - Check for 200 OK responses

---

## 🆘 Need Help?

If you've followed all steps and still have issues:

1. Open `test-stripe-webhook.html` and share the output
2. Check Supabase function logs for errors
3. Check Stripe webhook delivery attempts
4. Share any error messages you see

---

**Created:** November 7, 2025  
**Tools Created:** 
- `test-stripe-webhook.html` - Comprehensive webhook diagnostics
- `STRIPE_WEBHOOK_DIAGNOSIS.md` - This document
