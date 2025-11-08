# 🚀 Step-by-Step Deployment Guide

Follow these steps in order to fix your Stripe webhook integration.

---

## ✅ Step 1: Apply Database Migration

### Option A: Supabase SQL Editor (Easiest) 

1. **Open SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/sql/new

2. **Copy the entire SQL file:**
   - Open: `supabase/migrations/20251106_stripe_subscription_tables.sql`
   - Copy all content (Ctrl+A, Ctrl+C)

3. **Paste and Execute:**
   - Paste into SQL editor
   - Click "Run" (or press Ctrl+Enter)
   - Wait for "Success" message

4. **Verify tables created:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('stripe_events', 'stripe_invoices', 'subscription_history');
   ```
   **Expected:** 3 rows returned

5. **Verify functions created:**
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN ('log_stripe_event', 'update_subscriber_from_webhook', 'mark_event_processed');
   ```
   **Expected:** 3 rows returned

---

## ✅ Step 2: Deploy Updated Webhook Function

The webhook function has been updated to use your database schema properly.

```powershell
cd "C:\Users\Leon\Documents\Apartment-Locator-AI-Real-main\Apartment-Locator-AI-Scraper-Agent-Real\entity-guardian-pro"

# Deploy the webhook function
supabase functions deploy stripe-webhook
```

**What changed in the webhook function:**
- ✅ Now logs ALL events to `stripe_events` table
- ✅ Calls `update_subscriber_from_webhook()` database function
- ✅ Creates invoice records in `stripe_invoices` table
- ✅ Handles subscription lifecycle events (created, updated, deleted)
- ✅ Marks events as processed to prevent duplicates
- ✅ Better error handling with fallbacks
- ✅ More detailed logging

---

## ✅ Step 3: Verify Supabase Secrets

Check that all required secrets are set:

1. **Go to Supabase Secrets:**
   https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/settings/secrets

2. **Required Secrets:**

   | Secret Name | Format | Example |
   |-------------|--------|---------|
   | `STRIPE_SECRET_KEY` | sk_live_... or sk_test_... | sk_live_51S0ulg... |
   | `STRIPE_PUBLISHABLE_KEY` | pk_live_... or pk_test_... | pk_live_51S0ulg... |
   | `STRIPE_WEBHOOK_SECRET` | whsec_... | (Get this in Step 4) |

3. **If missing, add them:**
   - Click "Add new secret"
   - Enter name and value
   - Click "Save"

**Note:** `STRIPE_WEBHOOK_SECRET` will be added after Step 4.

---

## ✅ Step 4: Register Webhook in Stripe Dashboard

This is crucial - Stripe won't send events without webhook registration.

### 4.1 Open Stripe Webhooks

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint" button

### 4.2 Configure Endpoint

**Endpoint URL:**
```
https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook
```

**Description:**
```
Supabase Webhook Handler
```

**Listen to:**
- Select "Events on your account"

**Events to send:**

Select these events (critical for subscription management):

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

### 4.3 Get Webhook Secret

1. After creating the endpoint, click on it
2. Click "Reveal" next to "Signing secret"
3. Copy the secret (starts with `whsec_...`)

### 4.4 Add Secret to Supabase

1. Go to: https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/settings/secrets
2. Click "Add new secret"
3. Name: `STRIPE_WEBHOOK_SECRET`
4. Value: Paste the `whsec_...` value
5. Click "Save"

### 4.5 Redeploy Webhook Function

After adding the secret, redeploy:

```powershell
supabase functions deploy stripe-webhook
```

---

## ✅ Step 5: Test the Webhook

### 5.1 Test from Stripe Dashboard

1. Go to your webhook endpoint in Stripe Dashboard
2. Click "Send test webhook"
3. Select event: `checkout.session.completed`
4. Click "Send test webhook"
5. Check response status (should be 200)

### 5.2 Test with Diagnostic Tool

Open the diagnostic tool I created:

```powershell
start test-stripe-webhook.html
```

Run all tests to verify:
- ✅ Webhook endpoint accessible
- ✅ Database tables exist
- ✅ Supabase secrets configured
- ✅ Events being logged

### 5.3 Check Supabase Logs

1. Go to: https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/logs/edge-functions
2. Filter by: `stripe-webhook`
3. Look for recent events
4. Check for errors (red) vs success (green)

### 5.4 Query Database for Events

Run this query in Supabase SQL Editor:

```sql
-- Check recent webhook events
SELECT 
  stripe_event_id,
  event_type,
  processed,
  error_message,
  created_at
FROM stripe_events
ORDER BY created_at DESC
LIMIT 10;

-- Check if subscribers are being updated
SELECT 
  email,
  subscription_tier,
  subscription_status,
  stripe_subscription_id,
  current_period_end
FROM subscribers
WHERE stripe_subscription_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- Check invoice records
SELECT 
  stripe_invoice_id,
  status,
  amount_paid,
  currency,
  paid_at
FROM stripe_invoices
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ Step 6: Test End-to-End (Optional but Recommended)

### Create a Test Subscription

1. **Start your dev server:**
   ```powershell
   npm run dev
   ```

2. **Navigate to billing page in browser**

3. **Select a plan** (Stripe Test Mode)

4. **Complete checkout with test card:**
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

5. **After checkout, verify:**
   - Check Supabase function logs
   - Query `stripe_events` table (should show new events)
   - Query `subscribers` table (should show updated subscription)
   - Check Stripe Dashboard → Events log

---

## 🎯 What Should Happen After Fix

### On Stripe Side:
1. ✅ Webhook endpoint shows "Active" status
2. ✅ Test events return 200 OK
3. ✅ Recent events show successful delivery
4. ✅ No retry attempts or errors

### On Supabase Side:
1. ✅ `stripe_events` table has records
2. ✅ Events marked as `processed = true`
3. ✅ `subscribers` table has updated subscription data
4. ✅ `stripe_invoices` table has invoice records
5. ✅ Function logs show processing messages
6. ✅ No error messages in logs

---

## 🔍 Troubleshooting

### Issue: Migration fails with "permission denied"
**Solution:** Make sure you're using the SQL editor as the postgres user (default).

### Issue: Functions deploy but "function not found" errors
**Solution:** The migration needs to be applied first. Functions are created by the migration SQL.

### Issue: Webhook returns 400 "Invalid signature"
**Solution:** 
1. Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
2. Copy the EXACT value from Stripe Dashboard
3. Redeploy function after setting secret

### Issue: Events logged but subscribers not updated
**Solution:** 
1. Check function logs for errors
2. Verify `update_subscriber_from_webhook` function exists in database
3. The function will fall back to direct inserts if database function doesn't exist

### Issue: "duplicate key value violates unique constraint"
**Solution:** This is expected! It means the same event was sent multiple times. The system is working correctly by preventing duplicates.

---

## 📊 Expected Database State

After everything is working, your database should look like this:

### stripe_events Table
```
| id | stripe_event_id | event_type                    | processed | created_at          |
|----|-----------------|-------------------------------|-----------|---------------------|
| 1  | evt_1ABC...     | checkout.session.completed    | true      | 2025-11-07 10:30:00 |
| 2  | evt_1DEF...     | customer.subscription.created | true      | 2025-11-07 10:30:02 |
| 3  | evt_1GHI...     | invoice.payment_succeeded     | true      | 2025-11-07 10:30:05 |
```

### subscribers Table
```
| email              | subscription_tier | subscription_status | stripe_subscription_id |
|--------------------|-------------------|---------------------|------------------------|
| user@example.com   | growth            | active              | sub_1ABC...            |
```

### stripe_invoices Table
```
| stripe_invoice_id | status | amount_paid | currency | paid_at             |
|-------------------|--------|-------------|----------|---------------------|
| in_1ABC...        | paid   | 4900        | usd      | 2025-11-07 10:30:05 |
```

---

## 📚 Files Modified

1. ✅ `supabase/functions/stripe-webhook/index.ts` - Updated to use database schema
2. ✅ `test-stripe-webhook.html` - Created diagnostic tool
3. ✅ `STRIPE_WEBHOOK_DIAGNOSIS.md` - Created diagnosis document
4. ✅ `APPLY_MIGRATION_INSTRUCTIONS.md` - Created migration instructions
5. ✅ `FIX_DEPLOYMENT_GUIDE.md` - This guide

---

## 🎉 Success Criteria

You'll know everything is working when:

- [ ] Migration applied successfully (3 new tables, 3 new functions)
- [ ] Webhook function deployed without errors
- [ ] All Supabase secrets configured
- [ ] Webhook registered in Stripe Dashboard
- [ ] Test webhook event returns 200 OK
- [ ] Event appears in `stripe_events` table
- [ ] Subscriber record updated in database
- [ ] No errors in Supabase function logs
- [ ] No failed deliveries in Stripe webhook logs

---

## 🆘 Need Help?

1. **Check function logs:** https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/logs/edge-functions
2. **Check Stripe events:** https://dashboard.stripe.com/events
3. **Run diagnostic tool:** Open `test-stripe-webhook.html` in browser
4. **Check database:** Query `stripe_events` and `subscribers` tables

---

**Created:** November 7, 2025  
**Next Steps:** Follow steps 1-6 in order
