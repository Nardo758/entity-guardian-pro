# 🔌 Stripe Wire-Up Checklist

## Current Setup Analysis

### ✅ What's Already Working
1. **Edge Functions Created:**
   - ✅ `check-stripe` - Validates Stripe configuration
   - ✅ `get-stripe-config` - Returns publishable key
   - ✅ `create-checkout` - Creates Stripe checkout sessions
   - ✅ `stripe-webhook` - Handles Stripe webhooks
   - ✅ `sync-pricing` - Syncs products to Stripe

2. **Frontend Integration:**
   - ✅ `src/lib/stripe.ts` - Stripe client initialization
   - ✅ Uses secure edge function to get keys (no hardcoded keys)
   - ✅ Pricing tiers defined

### ⚠️ Configuration Required

## Step 1: Set Supabase Secrets

You need to add these secrets to your Supabase project:

**Go to:** https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/settings/secrets

Add the following secrets:

```bash
# Test Mode (Development)
STRIPE_PUBLISHABLE_KEY=pk_test_51S0ulgCnuIeihlVEvkKFnrDPDbVGYvl16OsN9CWTmFbmEz3jB64Hd9WuCk7JNuWoBICO5nQkcEqlo5GYEPnizLhc00M8VnktP8
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE

# Live Mode (Production) - Use these when ready to go live
# STRIPE_PUBLISHABLE_KEY=pk_live_51S0ulgCnuIeihlVEvkKFnrDPDbVGYvl16OsN9CWTmFbmEz3jB64Hd9WuCk7JNuWoBICO5nQkcEqlo5GYEPnizLhc00M8VnktP8
# STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE

# Webhook Secret (after creating webhook in Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

**Get your Stripe keys from:** https://dashboard.stripe.com/apikeys

### Important Notes:
- ⚠️ **Never commit secret keys to git** (already protected by `.gitignore`)
- 🔄 Use **test mode keys** (pk_test_/sk_test_) for development
- 🚀 Switch to **live mode keys** (pk_live_/sk_live_) for production
- 🔔 Get webhook secret after creating webhook endpoint (Step 4)

## Step 2: Verify Secrets Are Set

After adding secrets, **redeploy all Stripe-related functions:**

```bash
# Deploy all functions that use Stripe
cd supabase/functions

# Deploy one by one to ensure they pick up new secrets
supabase functions deploy check-stripe
supabase functions deploy get-stripe-config
supabase functions deploy create-checkout
supabase functions deploy sync-pricing
supabase functions deploy stripe-webhook
```

**Or deploy all at once:**
```bash
supabase functions deploy
```

## Step 3: Test Configuration

### Option A: Using Browser Tool
Open in browser: `file:///C:/Users/Leon/Documents/Apartment-Locator-AI-Real-main/Apartment-Locator-AI-Scraper-Agent-Real/entity-guardian-pro/test-stripe-check.html`

### Option B: Using Node.js Script
```bash
node diagnose-stripe.js
```

### Option C: Manual curl test
```bash
# Test check-stripe endpoint
curl -X GET https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/check-stripe \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY"

# Test get-stripe-config endpoint
curl -X GET https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/get-stripe-config \
  -H "apikey: YOUR_SUPABASE_ANON_KEY"
```

Your anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdXhxb3BmY2dpdnlwYml5bmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNDI1NzMsImV4cCI6MjA3MTkxODU3M30.-RkbzPY_FZVd9qShJxi959LLSqWXYI7Mkqk1DqJVt6o`

## Step 4: Sync Products to Stripe

Once secrets are configured, sync your pricing tiers to Stripe:

### Option A: Using Browser Tool
Open in browser: `file:///C:/Users/Leon/Documents/Apartment-Locator-AI-Real-main/Apartment-Locator-AI-Scraper-Agent-Real/entity-guardian-pro/test-stripe-sync.html`

Click "🚀 Sync Pricing to Stripe"

### Option B: Using curl
```bash
curl -X POST https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/sync-pricing \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Expected Result:** Creates 4 products in Stripe (Starter, Growth, Professional, Enterprise), each with monthly and yearly pricing.

## Step 5: Fix Frontend Authorization Issue

### Current Issue
Your `get-stripe-config` function doesn't require authorization, but `check-stripe` does.

### Fix Option 1: Add CORS and No Auth to get-stripe-config (Recommended)
The function already has CORS headers and `verifyJWT = false`, so it should work without auth.

### Fix Option 2: Add Auth Header to Frontend Calls

Update `src/lib/stripe.ts` to include auth if needed:

```typescript
import { supabase } from '@/integrations/supabase/client';

const getStripePublishableKey = async (): Promise<string> => {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add auth header if session exists
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    const response = await fetch(
      'https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/get-stripe-config',
      {
        method: 'GET',
        headers,
      }
    );
    
    const data = await response.json();
    if (!data.publishableKey) {
      throw new Error('No publishable key returned from secure endpoint');
    }
    return data.publishableKey;
  } catch (error) {
    console.error('Failed to get secure Stripe key:', error);
    throw new Error('Unable to initialize Stripe - please check configuration');
  }
};
```

## Step 6: Configure Stripe Webhook

1. **Go to Stripe Dashboard:** https://dashboard.stripe.com/webhooks
2. **Click "Add endpoint"**
3. **Enter webhook URL:**
   ```
   https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook
   ```
4. **Select events to listen to:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. **Copy the webhook signing secret** (starts with `whsec_`)
6. **Add to Supabase secrets:**
   ```
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```
7. **Redeploy webhook function:**
   ```bash
   supabase functions deploy stripe-webhook
   ```

## Step 7: Test End-to-End Flow

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to billing page:** http://localhost:5173/billing

3. **Click on a subscription tier**

4. **Verify redirect to Stripe Checkout**

5. **Use Stripe test cards:**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - CVC: Any 3 digits
   - Date: Any future date
   - ZIP: Any 5 digits

6. **Complete checkout and verify:**
   - User is redirected back to your app
   - Subscription is created in database
   - Webhook received and processed

## Step 8: Monitor and Debug

### Check Edge Function Logs
**Supabase Dashboard:** https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/logs/edge-functions

### Check Stripe Logs
**Stripe Dashboard:** https://dashboard.stripe.com/logs

### Common Issues

#### Issue: "publishable key not configured"
**Solution:** Add `STRIPE_PUBLISHABLE_KEY` to Supabase secrets and redeploy functions

#### Issue: "Missing authorization header"
**Solution:** 
- For `get-stripe-config`: Should work without auth (has `verifyJWT = false`)
- For `check-stripe`: Add `Authorization: Bearer <token>` header

#### Issue: "Stripe failed to initialize"
**Solution:** Check browser console for specific error, verify secrets are set

#### Issue: Webhook not receiving events
**Solution:** 
- Verify webhook URL is correct in Stripe Dashboard
- Check webhook secret is set in Supabase
- Verify webhook events are selected
- Check edge function logs for errors

## Verification Checklist

Use this checklist to verify everything is working:

- [ ] **Secrets Set in Supabase**
  - [ ] STRIPE_PUBLISHABLE_KEY
  - [ ] STRIPE_SECRET_KEY
  - [ ] STRIPE_WEBHOOK_SECRET (after webhook created)

- [ ] **Functions Deployed**
  - [ ] check-stripe
  - [ ] get-stripe-config
  - [ ] create-checkout
  - [ ] sync-pricing
  - [ ] stripe-webhook

- [ ] **Configuration Verified**
  - [ ] Run `test-stripe-check.html` - All checks pass
  - [ ] Run `test-stripe-sync.html` - Products created
  - [ ] Check Stripe Dashboard - 4 products visible

- [ ] **Webhook Configured**
  - [ ] Endpoint created in Stripe Dashboard
  - [ ] Events selected
  - [ ] Secret added to Supabase

- [ ] **End-to-End Test**
  - [ ] Can navigate to billing page
  - [ ] Can click subscription tier
  - [ ] Redirects to Stripe Checkout
  - [ ] Can complete test payment
  - [ ] Redirects back to app
  - [ ] Subscription appears in database

## Quick Commands Reference

```bash
# Deploy functions
supabase functions deploy

# Test configuration
node diagnose-stripe.js

# Start dev server
npm run dev

# Check git status
git status

# View edge function logs
# Go to: https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/logs/edge-functions
```

## Need Help?

If you see errors like:
- "publishable key not configured" → Set secrets in Supabase, redeploy functions
- "Missing authorization header" → Check if function has `verifyJWT = false` or add auth header
- "Stripe failed to initialize" → Check browser console, verify secrets

Open `test-stripe-check.html` in your browser to see a detailed diagnostic report.

---

**Last Updated:** November 6, 2025
**Project:** Entity Guardian Pro
**Environment:** Test Mode (Development)
