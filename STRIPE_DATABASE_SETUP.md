# 🗄️ Database Configuration for Stripe Webhooks

## Overview

To properly handle Stripe subscription webhooks, your Supabase database needs to be configured with the right tables and fields. This document explains what's needed and what has been set up.

## ✅ What You Already Have

### Existing Tables
- ✅ `subscribers` - Basic subscription tracking
- ✅ `payments` - Payment history
- ✅ `payment_methods` - Stored payment methods

## 🆕 What's Been Added

### Migration: `20251106_stripe_subscription_tables.sql`

This migration enhances your database to properly handle the full Stripe subscription lifecycle.

### 1. Enhanced `subscribers` Table

**New Stripe-specific fields:**
```sql
stripe_subscription_id    -- Stripe subscription ID (sub_xxx)
stripe_price_id          -- Stripe price ID (price_xxx)
stripe_product_id        -- Stripe product ID (prod_xxx)
subscription_status      -- active, canceled, past_due, etc.
current_period_start     -- Billing period start
current_period_end       -- Billing period end
cancel_at_period_end     -- Whether subscription cancels at period end
canceled_at              -- When subscription was canceled
billing_cycle            -- monthly or yearly
trial_end                -- Trial period end date
entities_limit           -- Max entities allowed for tier
```

**Why these fields are needed:**
- `stripe_subscription_id` - Links to Stripe subscription for updates/cancellations
- `subscription_status` - Tracks exact subscription state from Stripe
- `current_period_*` - Determines access during billing periods
- `entities_limit` - Enforces tier limits (4 for Starter, 20 for Growth, etc.)
- `billing_cycle` - Different pricing for monthly vs yearly

### 2. New `stripe_invoices` Table

Stores complete invoice history from Stripe:
```sql
stripe_invoice_id        -- Stripe invoice ID (in_xxx)
stripe_customer_id       -- Customer this invoice belongs to
stripe_subscription_id   -- Associated subscription
amount_due               -- Amount owed (in cents)
amount_paid              -- Amount paid (in cents)
status                   -- draft, open, paid, uncollectible, void
invoice_pdf              -- Link to PDF invoice
hosted_invoice_url       -- Link to hosted invoice page
period_start/period_end  -- Billing period covered
due_date                 -- When payment is due
paid_at                  -- When payment was made
```

**Use cases:**
- Display billing history to users
- Download past invoices
- Track payment failures
- Calculate revenue

### 3. New `stripe_events` Table

Logs all webhook events for debugging and audit trail:
```sql
stripe_event_id          -- Stripe event ID (evt_xxx)
event_type               -- Event type (e.g., 'checkout.session.completed')
event_data               -- Full event JSON data
processed                -- Whether event was processed successfully
error_message            -- Error details if processing failed
processed_at             -- When event was processed
```

**Why you need this:**
- Debugging webhook issues
- Preventing duplicate event processing
- Audit trail of all Stripe events
- Replay failed events

### 4. New `subscription_history` Table

Tracks all subscription changes over time:
```sql
user_id                  -- User who owns the subscription
subscription_tier        -- Tier at this point in time
billing_cycle            -- Monthly or yearly
status                   -- Subscription status
started_at               -- When this tier started
ended_at                 -- When this tier ended (if applicable)
amount                   -- Price paid (in cents)
stripe_subscription_id   -- Stripe subscription ID
reason                   -- Why changed (upgrade, downgrade, cancellation)
```

**Use cases:**
- Show user their subscription history
- Analytics on tier changes
- Revenue reporting
- Customer support reference

### 5. New Database Functions

#### `update_subscriber_from_webhook()`

**Purpose:** Processes Stripe webhook data and updates subscriber record

**Parameters:**
- `p_stripe_customer_id` - Customer ID from Stripe
- `p_stripe_subscription_id` - Subscription ID from Stripe
- `p_stripe_price_id` - Price ID (identifies tier and billing cycle)
- `p_subscription_status` - Current subscription status
- `p_current_period_start` - Billing period start
- `p_current_period_end` - Billing period end
- `p_cancel_at_period_end` - Whether subscription cancels at end

**What it does:**
1. Finds subscriber by stripe_customer_id
2. Determines tier from price_id (Starter, Growth, Professional, Enterprise)
3. Determines billing cycle (monthly vs yearly)
4. Sets entities_limit based on tier
5. Updates all subscription fields
6. Returns user_id for further processing

**Example usage in webhook:**
```typescript
SELECT update_subscriber_from_webhook(
  'cus_xxx',           -- stripe_customer_id
  'sub_xxx',           -- stripe_subscription_id
  'price_xxx',         -- stripe_price_id
  'active',            -- subscription_status
  '2025-11-01',        -- current_period_start
  '2025-12-01',        -- current_period_end
  false                -- cancel_at_period_end
);
```

#### `log_subscription_change()`

**Purpose:** Automatically logs subscription changes to history table

**Trigger:** Runs automatically when subscribers table is updated

**What it logs:**
- Tier upgrades/downgrades
- Status changes (active → canceled)
- Billing cycle changes (monthly → yearly)
- Cancellations with reason

### 6. New View: `active_subscriptions`

**Purpose:** Easy query for all active subscriptions

**Includes:**
- All subscriber fields
- Calculated `is_active` field (checks status and expiration)
- Only shows active or trialing subscriptions

**Use in your app:**
```typescript
const { data } = await supabase
  .from('active_subscriptions')
  .select('*')
  .eq('user_id', userId)
  .single();
```

## 🔄 Webhook Event Mapping

### Events Your Webhook Should Handle

#### 1. `checkout.session.completed`
**When:** User completes checkout and starts subscription
**Database actions:**
- Create or update subscriber record
- Set stripe_customer_id and stripe_subscription_id
- Set subscription_status = 'active'
- Set current_period_start and current_period_end
- Determine tier from price_id
- Log event to stripe_events

#### 2. `customer.subscription.created`
**When:** New subscription is created
**Database actions:**
- Call `update_subscriber_from_webhook()`
- Set all subscription fields
- Log to subscription_history

#### 3. `customer.subscription.updated`
**When:** Subscription is modified (upgrade, downgrade, renewal)
**Database actions:**
- Call `update_subscriber_from_webhook()` with new data
- Update subscription fields
- Auto-logged to subscription_history by trigger

#### 4. `customer.subscription.deleted`
**When:** Subscription is canceled/expired
**Database actions:**
- Set subscription_status = 'canceled'
- Set canceled_at timestamp
- Set subscribed = false
- Log to subscription_history

#### 5. `invoice.payment_succeeded`
**When:** Subscription payment succeeds
**Database actions:**
- Insert record into stripe_invoices table
- Update subscriber.current_period_end if renewal
- Ensure subscription_status = 'active'

#### 6. `invoice.payment_failed`
**When:** Subscription payment fails
**Database actions:**
- Insert failed invoice to stripe_invoices
- Set subscription_status = 'past_due'
- Send notification to user
- Log event for follow-up

## 📊 Database Indexes

Optimized indexes for performance:
```sql
-- Subscribers
idx_subscribers_stripe_customer_id
idx_subscribers_stripe_subscription_id
idx_subscribers_subscription_status
idx_subscribers_user_id

-- Invoices
idx_stripe_invoices_customer_id
idx_stripe_invoices_subscription_id
idx_stripe_invoices_user_id
idx_stripe_invoices_status

-- Events
idx_stripe_events_event_type
idx_stripe_events_processed
idx_stripe_events_created_at

-- History
idx_subscription_history_user_id
idx_subscription_history_started_at
```

## 🔐 Row Level Security (RLS)

All tables have RLS enabled:

**Users can:**
- View their own subscription data
- View their own invoices
- View their own subscription history

**Service role can:**
- Read/write all data (used by webhooks)
- Process events
- Update subscription status

**Users cannot:**
- View other users' data
- Modify subscription status directly
- Access webhook event logs

## 🚀 Applying the Migration

### Option 1: Using PowerShell Script (Recommended)
```powershell
.\setup-stripe-database.ps1
```

This script will:
1. Verify Supabase CLI is installed
2. Link to your project
3. Apply the migration
4. Verify tables were created

### Option 2: Using Supabase CLI
```bash
# Make sure you're linked to your project
supabase link --project-ref wcuxqopfcgivypbiynjp

# Apply migrations
supabase db push
```

### Option 3: Manual Application
1. Go to: https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/editor
2. Open SQL Editor
3. Copy contents of `supabase/migrations/20251106_stripe_subscription_tables.sql`
4. Paste and execute

## ✅ Verification Checklist

After applying migration, verify:

- [ ] `subscribers` table has new Stripe columns
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'subscribers' 
  AND column_name LIKE 'stripe%';
  ```

- [ ] New tables exist
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('stripe_invoices', 'stripe_events', 'subscription_history');
  ```

- [ ] Functions exist
  ```sql
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name IN ('update_subscriber_from_webhook', 'log_subscription_change');
  ```

- [ ] View exists
  ```sql
  SELECT table_name FROM information_schema.views 
  WHERE table_schema = 'public' 
  AND table_name = 'active_subscriptions';
  ```

## 🔄 Next Steps

1. **Apply the migration**
   ```powershell
   .\setup-stripe-database.ps1
   ```

2. **Update webhook handler**
   - Modify `supabase/functions/stripe-webhook/index.ts`
   - Use new database fields
   - Call `update_subscriber_from_webhook()` function
   - Log events to `stripe_events` table

3. **Deploy updated webhook**
   ```bash
   supabase functions deploy stripe-webhook
   ```

4. **Test webhook integration**
   ```powershell
   .\setup-stripe-webhook.ps1
   ```

5. **Verify webhook processing**
   - Send test events from Stripe Dashboard
   - Check `stripe_events` table for logged events
   - Verify `subscribers` table is updated
   - Check `subscription_history` for changes

## 📚 Related Documentation

- **Migration File:** `supabase/migrations/20251106_stripe_subscription_tables.sql`
- **Database Setup Script:** `setup-stripe-database.ps1`
- **Webhook Setup:** `STRIPE_WIRE_UP_CHECKLIST.md`
- **Current Status:** `STRIPE_STATUS.md`

## 🆘 Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution:** Some columns may already exist. The migration uses `IF NOT EXISTS` to prevent errors. Safe to ignore these warnings.

### Issue: Function creation fails
**Solution:** Drop the function first:
```sql
DROP FUNCTION IF EXISTS update_subscriber_from_webhook;
```
Then re-run migration.

### Issue: RLS policies prevent updates
**Solution:** Webhook uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS. Make sure webhook function has service role key configured.

### Issue: Can't see data in tables
**Solution:** Check RLS policies. Users can only see their own data. Use service role to view all data:
```typescript
const supabase = createClient(
  supabaseUrl,
  serviceRoleKey  // Not anon key
);
```

---

**Last Updated:** November 6, 2025
**Migration Version:** 20251106_stripe_subscription_tables.sql
