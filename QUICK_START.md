# ⚡ Quick Start - Fix Stripe Webhooks

## What I Fixed

✅ **Updated webhook function** - Now properly uses your database schema  
✅ **Deployed to Supabase** - Function is live and ready  
📝 **Created diagnostic tools** - Easy testing and troubleshooting  

---

## What YOU Need to Do (3 Steps)

### 1️⃣ Apply Database Migration (2 minutes)

Your comprehensive database schema exists but needs to be applied.

**Open Supabase SQL Editor:**
https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/sql/new

**Copy & Run:**
Open `supabase/migrations/20251106_stripe_subscription_tables.sql` and paste ALL content into the SQL editor, then click "Run".

**Verify it worked:**
```sql
SELECT count(*) FROM stripe_events;
```
Should return `0` (not an error - just means table exists but empty)

---

### 2️⃣ Register Webhook in Stripe (3 minutes)

**Go to Stripe:**
https://dashboard.stripe.com/webhooks

**Click "Add endpoint"**

**Enter URL:**
```
https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook
```

**Select these events:**
- ✓ checkout.session.completed
- ✓ customer.subscription.created
- ✓ customer.subscription.updated
- ✓ customer.subscription.deleted
- ✓ invoice.payment_succeeded
- ✓ invoice.payment_failed

**After creating:**
1. Click "Reveal" next to "Signing secret"
2. Copy the `whsec_...` value
3. Go to: https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/settings/secrets
4. Add secret: Name = `STRIPE_WEBHOOK_SECRET`, Value = the whsec value
5. Run: `supabase functions deploy stripe-webhook`

---

### 3️⃣ Test It Works (1 minute)

**Option A: From Stripe Dashboard**
1. Go to your webhook endpoint in Stripe
2. Click "Send test webhook"
3. Select `checkout.session.completed`
4. Should return 200 OK

**Option B: Using Diagnostic Tool**
Open `test-stripe-webhook.html` in your browser and click "Run All Tests"

**Option C: Check Database**
```sql
SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 5;
```
Should show events after testing

---

## ✅ Success = Events Show Up in Both Places

**In Stripe:** Dashboard → Webhooks → Your endpoint → Should show successful deliveries  
**In Supabase:** SQL Editor → `SELECT * FROM stripe_events` → Should have records

---

## 🔍 Detailed Documentation

- **Full deployment guide:** `FIX_DEPLOYMENT_GUIDE.md`
- **Problem diagnosis:** `STRIPE_WEBHOOK_DIAGNOSIS.md`
- **Migration help:** `APPLY_MIGRATION_INSTRUCTIONS.md`

---

## 🎯 What's Different Now

### Before (Broken):
- ❌ Events not logged to database
- ❌ No invoice tracking
- ❌ No subscription history
- ❌ Limited event handling (only 2 types)
- ❌ No duplicate prevention

### After (Fixed):
- ✅ All events logged to `stripe_events` table
- ✅ Invoices tracked in `stripe_invoices` table
- ✅ Subscription changes tracked in `subscription_history` table
- ✅ Handles 7+ event types
- ✅ Duplicate events prevented automatically
- ✅ Falls back gracefully if functions don't exist yet
- ✅ Detailed logging for debugging

---

## 🆘 Quick Troubleshooting

**"Table does not exist"** → Run Step 1 (apply migration)  
**"Invalid signature"** → Check Step 2.5 (webhook secret)  
**"Function not found"** → Run Step 1 first, functions are created by migration  
**Events not showing** → Check Stripe webhook is registered (Step 2)

---

**Ready?** Start with Step 1! 🚀
