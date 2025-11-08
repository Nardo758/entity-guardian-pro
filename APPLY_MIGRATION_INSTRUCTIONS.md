# 📝 How to Apply Stripe Database Migration

The migration history has some mismatches. Here's the easiest way to apply the Stripe schema:

## Option 1: Supabase SQL Editor (Recommended) ✅

1. **Open Supabase SQL Editor:**
   https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/sql/new

2. **Copy the migration file:**
   - File: `supabase/migrations/20251106_stripe_subscription_tables.sql`
   - Or use the content below

3. **Paste and Run:**
   - Paste entire SQL content into the editor
   - Click "Run" (or press Ctrl+Enter)
   - Wait for completion

4. **Verify tables created:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('stripe_events', 'stripe_invoices', 'subscription_history');
   ```
   Should return 3 rows.

5. **Verify functions created:**
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name LIKE '%stripe%';
   ```
   Should show: `log_stripe_event`, `update_subscriber_from_webhook`, `mark_event_processed`

## Option 2: Direct Database Connection

If you have the database password:

```powershell
# Connect using psql
psql "postgresql://postgres:[YOUR-PASSWORD]@db.wcuxqopfcgivypbiynjp.supabase.co:5432/postgres"

# Then run
\i supabase/migrations/20251106_stripe_subscription_tables.sql
```

## Option 3: Create New Migration

Since the history is out of sync, you can mark the remote ones as reverted and create fresh:

```powershell
cd supabase

# Repair the migration history (if needed)
supabase migration repair --status applied 20251106
supabase migration repair --status applied 20251107

# Then push
supabase db push
```

## ✅ After Migration Applied

Run this SQL to verify everything is set up:

```sql
-- Check tables exist
SELECT 
    'stripe_events' as table_name,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'stripe_events') as exists
UNION ALL
SELECT 
    'stripe_invoices',
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'stripe_invoices')
UNION ALL
SELECT 
    'subscription_history',
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'subscription_history');

-- Check functions exist
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('log_stripe_event', 'update_subscriber_from_webhook', 'mark_event_processed');

-- Check subscribers table has new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscribers'
AND column_name IN ('stripe_subscription_id', 'subscription_status', 'current_period_start', 'current_period_end');
```

## 🎯 What the Migration Does

This migration adds:

### New Tables:
- **stripe_events** - Logs all webhook events
- **stripe_invoices** - Stores invoice data
- **subscription_history** - Tracks subscription changes over time

### New Columns on subscribers:
- stripe_subscription_id
- stripe_price_id
- stripe_product_id
- subscription_status
- current_period_start
- current_period_end
- cancel_at_period_end
- canceled_at
- billing_cycle
- trial_end
- entities_limit

### New Functions:
- **update_subscriber_from_webhook()** - Processes subscription events
- **log_stripe_event()** - Logs events safely
- **mark_event_processed()** - Marks events as processed

### Security:
- RLS policies for all tables
- Service role access only for webhook functions
- Indexes for performance
- Triggers for automatic history logging

---

## 🚀 Next Step

After migration is applied, we'll update the webhook function code.
