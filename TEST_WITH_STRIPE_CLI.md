# 🧪 Test Webhooks with Stripe CLI

You have the Stripe CLI installed! Let's use it to test your webhook integration before going live.

**Stripe CLI Path:** `C:\Users\Leon\Documents\stripe.exe`  
**Version:** 1.32.0

---

## 🎯 What Stripe CLI Does

The Stripe CLI lets you:
- ✅ Send test webhook events to your endpoint
- ✅ Forward live Stripe events to localhost
- ✅ Test webhook signature validation
- ✅ Debug webhook processing in real-time

---

## ⚡ Quick Test (Easiest)

### Test Your Deployed Webhook

Send a test event directly to your Supabase webhook endpoint:

```powershell
# Navigate to stripe.exe location
cd C:\Users\Leon\Documents

# Send a checkout.session.completed test event
.\stripe.exe trigger checkout.session.completed `
  --webhook-endpoint https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook
```

**What this does:**
1. Creates a fake checkout session in Stripe
2. Sends webhook event to your endpoint
3. Shows the response from your webhook

**Expected Output:**
```
Setting up fixture for: checkout.session.completed
Running fixture for: checkout.session.completed
Trigger succeeded! Check dashboard for event details.
```

**Then verify:**
```sql
-- In Supabase SQL Editor
SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 1;
```

---

## 🔐 First Time Setup

If you haven't logged in to Stripe CLI yet:

```powershell
cd C:\Users\Leon\Documents

# Login to Stripe (opens browser)
.\stripe.exe login

# This will:
# 1. Open your browser
# 2. Ask you to authorize CLI access
# 3. Save credentials locally
```

**Confirm it worked:**
```powershell
.\stripe.exe config --list
```

Should show your account info.

---

## 📡 Test Different Event Types

### 1. Checkout Session Completed
```powershell
.\stripe.exe trigger checkout.session.completed
```

### 2. Subscription Created
```powershell
.\stripe.exe trigger customer.subscription.created
```

### 3. Subscription Updated
```powershell
.\stripe.exe trigger customer.subscription.updated
```

### 4. Subscription Deleted
```powershell
.\stripe.exe trigger customer.subscription.deleted
```

### 5. Invoice Payment Succeeded
```powershell
.\stripe.exe trigger invoice.payment_succeeded
```

### 6. Invoice Payment Failed
```powershell
.\stripe.exe trigger invoice.payment_failed
```

---

## 🎬 Complete Test Flow

### Step 1: Apply Migration (if not done yet)

Open Supabase SQL Editor and run the migration:
https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/sql/new

### Step 2: Set Up Webhook Secret for CLI Testing

```powershell
# Get your webhook signing secret for testing
.\stripe.exe listen --print-secret
```

This will output something like: `whsec_abc123...`

**Add this to Supabase:**
1. Go to: https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/settings/secrets
2. Add secret: `STRIPE_CLI_WEBHOOK_SECRET` = the whsec value
3. Redeploy: `supabase functions deploy stripe-webhook`

### Step 3: Send Test Events

```powershell
cd C:\Users\Leon\Documents

# Test checkout flow
.\stripe.exe trigger checkout.session.completed

# Test subscription lifecycle
.\stripe.exe trigger customer.subscription.created
.\stripe.exe trigger customer.subscription.updated
.\stripe.exe trigger customer.subscription.deleted

# Test payment events
.\stripe.exe trigger invoice.payment_succeeded
.\stripe.exe trigger invoice.payment_failed
```

### Step 4: Verify in Database

```sql
-- Check events were logged
SELECT 
  stripe_event_id,
  event_type,
  processed,
  error_message,
  created_at
FROM stripe_events
ORDER BY created_at DESC
LIMIT 10;

-- Check subscribers were updated
SELECT 
  email,
  subscription_tier,
  subscription_status,
  stripe_subscription_id,
  current_period_end
FROM subscribers
WHERE stripe_subscription_id IS NOT NULL
ORDER BY updated_at DESC;

-- Check invoices
SELECT 
  stripe_invoice_id,
  status,
  amount_paid / 100.0 as amount_dollars,
  currency,
  paid_at
FROM stripe_invoices
ORDER BY created_at DESC;
```

---

## 🔄 Forward Live Events (Advanced)

If you want to test with REAL Stripe events hitting your local development:

### Option 1: Forward to Supabase Webhook

```powershell
# Forward all events to your deployed webhook
.\stripe.exe listen --forward-to https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook

# Or forward specific events only
.\stripe.exe listen `
  --events checkout.session.completed,customer.subscription.updated `
  --forward-to https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook
```

### Option 2: Test Locally (If Running Local Supabase)

```powershell
# If you're running Supabase locally (not common)
.\stripe.exe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

**While listening:**
- Real events from your Stripe account will be forwarded
- You'll see events in the terminal in real-time
- Perfect for testing during development

---

## 🧪 Test Specific Scenarios

### Test Successful Subscription Flow

```powershell
# 1. Customer completes checkout
.\stripe.exe trigger checkout.session.completed

# 2. Subscription is created
.\stripe.exe trigger customer.subscription.created

# 3. Invoice is paid
.\stripe.exe trigger invoice.payment_succeeded
```

Then verify subscriber record is created and updated.

### Test Failed Payment Flow

```powershell
# Invoice payment fails
.\stripe.exe trigger invoice.payment_failed
```

Then verify subscriber status changed to `past_due`.

### Test Cancellation Flow

```powershell
# Subscription is deleted
.\stripe.exe trigger customer.subscription.deleted
```

Then verify subscriber marked as canceled.

---

## 🔍 Debug Mode

Run with verbose output to see exactly what's happening:

```powershell
.\stripe.exe trigger checkout.session.completed --log-level debug
```

This shows:
- Request payload
- Response from webhook
- HTTP status codes
- Timing information

---

## 📊 View Events in Stripe Dashboard

After triggering events, view them in Stripe:

**Test Mode Events:**
https://dashboard.stripe.com/test/events

**Live Mode Events:**
https://dashboard.stripe.com/events

---

## 🎯 Recommended Test Sequence

Run these commands in order to test the complete flow:

```powershell
cd C:\Users\Leon\Documents

# 1. Test webhook is accessible
.\stripe.exe trigger checkout.session.completed

# Wait 2 seconds, then check database:
# SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 1;

# 2. Test subscription events
.\stripe.exe trigger customer.subscription.created
.\stripe.exe trigger customer.subscription.updated

# Check database again

# 3. Test payment events
.\stripe.exe trigger invoice.payment_succeeded

# Check subscribers and stripe_invoices tables

# 4. Test failure handling
.\stripe.exe trigger invoice.payment_failed

# Verify subscription_status changed to 'past_due'

# 5. Test cancellation
.\stripe.exe trigger customer.subscription.deleted

# Verify subscription marked as canceled
```

---

## ✅ Success Criteria

After running tests, you should see:

**In stripe_events table:**
- [ ] All triggered events logged
- [ ] `processed = true` for all events
- [ ] No error_message values

**In subscribers table:**
- [ ] Records created/updated with subscription data
- [ ] subscription_status reflects latest event
- [ ] stripe_subscription_id populated

**In stripe_invoices table:**
- [ ] Invoice records created for payment events
- [ ] Correct amounts and statuses

**In Supabase function logs:**
- [ ] Processing messages for each event
- [ ] No error messages
- [ ] "Updated subscriber via database function" messages

---

## 🐛 Troubleshooting

### "Webhook endpoint not responding"
**Issue:** Webhook function may not be deployed or accessible.

**Solution:**
```powershell
# Check if endpoint is live
curl https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook -I

# Should return HTTP 200 or 400, not 404
```

### "Invalid signature" errors
**Issue:** Webhook secret mismatch.

**Solution:**
1. Get signing secret: `.\stripe.exe listen --print-secret`
2. Add to Supabase secrets as `STRIPE_CLI_WEBHOOK_SECRET`
3. Redeploy: `supabase functions deploy stripe-webhook`

### Events not appearing in database
**Issue:** Migration not applied yet.

**Solution:** Run the migration SQL first (see `APPLY_MIGRATION_INSTRUCTIONS.md`)

### "Function not found" in logs
**Issue:** Database functions don't exist yet.

**Solution:** 
1. Apply migration (creates functions)
2. Webhook has fallback logic, so it should still work partially

---

## 🔗 Useful Commands

```powershell
# List all available trigger events
.\stripe.exe trigger --help

# Get webhook signing secret for testing
.\stripe.exe listen --print-secret

# View recent events in terminal
.\stripe.exe events list

# Get details of specific event
.\stripe.exe events retrieve evt_xxxxx

# View webhook endpoints
.\stripe.exe webhook-endpoints list

# Check CLI version
.\stripe.exe --version

# View account info
.\stripe.exe config --list
```

---

## 📚 Documentation Links

- **Stripe CLI Docs:** https://stripe.com/docs/cli
- **Trigger Events:** https://stripe.com/docs/cli/trigger
- **Listen for Events:** https://stripe.com/docs/cli/listen
- **Testing Webhooks:** https://stripe.com/docs/webhooks/test

---

## 🚀 Quick Reference

**Your Setup:**
- Stripe CLI: `C:\Users\Leon\Documents\stripe.exe`
- Webhook URL: `https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook`
- Supabase Project: `wcuxqopfcgivypbiynjp`

**Most Common Commands:**
```powershell
cd C:\Users\Leon\Documents

# Quick test
.\stripe.exe trigger checkout.session.completed

# Live forwarding
.\stripe.exe listen --forward-to https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook

# Get webhook secret
.\stripe.exe listen --print-secret
```

---

## 🎉 Next Steps

1. **Run quick test:**
   ```powershell
   cd C:\Users\Leon\Documents
   .\stripe.exe trigger checkout.session.completed
   ```

2. **Check database:**
   ```sql
   SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 1;
   ```

3. **If that works, run the full test sequence above**

4. **When ready for production, register webhook in Stripe Dashboard** (see `FIX_DEPLOYMENT_GUIDE.md`)

---

**Created:** November 7, 2025  
**Stripe CLI Version:** 1.32.0  
**Ready to test!** 🚀
