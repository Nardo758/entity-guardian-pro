# ✅ Apply Database Migration - Simple Steps

You have the migration file open: `fix-subscribers-migration.sql`

This migration will:
- ✅ Add missing columns to subscribers table (user_id, subscription fields, etc.)
- ✅ Create stripe_events table
- ✅ Create stripe_invoices table
- ✅ Create subscription_history table
- ✅ Create all database functions for webhook processing
- ✅ Set up Row Level Security policies
- ✅ Create indexes for performance

---

## 📝 How to Apply

### Step 1: Copy the Migration SQL

The file is already open in your IDE. Copy ALL 411 lines (Ctrl+A, Ctrl+C).

### Step 2: Open Supabase SQL Editor

Click this link:
https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/sql/new

### Step 3: Paste and Run

1. Paste the entire SQL content (Ctrl+V)
2. Click "Run" button (or press Ctrl+Enter)
3. Wait for "Success" message

Should take ~5-10 seconds to complete.

---

## ✅ Verify It Worked

After running, execute these queries to verify:

### Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('stripe_events', 'stripe_invoices', 'subscription_history');
```
**Expected:** 3 rows

### Check Functions Exist
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('log_stripe_event', 'mark_event_processed', 'update_subscriber_from_webhook');
```
**Expected:** 3 rows

### Check Subscribers Columns
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'subscribers' 
AND column_name IN ('user_id', 'stripe_subscription_id', 'subscription_status', 'entities_limit');
```
**Expected:** 4 rows

---

## 🎯 What This Migration Does

### Adds to subscribers table:
- `user_id` - Links to auth.users
- `stripe_subscription_id` - Subscription ID from Stripe
- `stripe_price_id` - Price being paid
- `stripe_product_id` - Product ID
- `subscription_status` - active, canceled, past_due, etc.
- `current_period_start` - Billing period start
- `current_period_end` - Billing period end
- `cancel_at_period_end` - If canceling at period end
- `canceled_at` - When canceled
- `billing_cycle` - monthly or yearly
- `trial_end` - Trial end date
- `entities_limit` - Max entities for tier

### Creates new tables:
- `stripe_events` - Logs all webhook events
- `stripe_invoices` - Stores invoice data
- `subscription_history` - Tracks subscription changes

### Creates functions:
- `log_stripe_event()` - Logs events safely
- `mark_event_processed()` - Marks events as processed
- `update_subscriber_from_webhook()` - Updates subscriber from webhook
- `log_subscription_change()` - Trigger for history logging
- `sync_subscription_end()` - Keeps subscription_end in sync

### Sets up security:
- Row Level Security policies
- Proper permissions for service_role and authenticated users
- Indexes for fast queries

---

## 🚀 After Migration

Once the migration is applied:

### Test with Stripe CLI:
```powershell
.\test-webhook-cli.ps1
```

Choose option 1 for a quick test.

### Or test manually:
```powershell
cd C:\Users\Leon\Documents
.\stripe.exe trigger checkout.session.completed
```

### Then verify in database:
```sql
SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 1;
```

---

## 🆘 If Something Goes Wrong

### Error: "relation already exists"
This is OK! It means the table already exists. The migration will skip it and continue.

### Error: "column already exists"
This is OK! The migration uses `ADD COLUMN IF NOT EXISTS` so it's safe.

### Error: "constraint already exists"
This is OK! The migration checks for existing constraints before adding.

### Other errors?
Copy the error message and check:
1. You're using the correct Supabase project
2. You have proper permissions (postgres user)
3. Share the error message for help

---

## 🎉 Ready?

1. **Copy:** All 411 lines from `fix-subscribers-migration.sql`
2. **Open:** https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/sql/new
3. **Paste & Run:** Ctrl+V, then click "Run"
4. **Verify:** Run the check queries above
5. **Test:** Run `.\test-webhook-cli.ps1`

---

**This migration is safe to run multiple times - it checks for existing objects before creating them.**
