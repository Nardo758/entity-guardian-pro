# 🚀 Next Steps - Complete Stripe Setup

## ✅ What's Done

1. ✅ Fixed all Stripe subscription tier mismatches
2. ✅ Updated all edge functions (7 files)
3. ✅ Added Stripe publishable key to .env file
4. ✅ Created comprehensive documentation

## ⚠️ You're Using LIVE Stripe Keys

Your publishable key starts with `pk_live_...` which means **real payments** will be processed.

---

## 📋 Required Steps (In Order)

### Step 1: Add Stripe Secret Key to Supabase ⚙️

**CRITICAL:** You need to add your **live secret key** to Supabase.

1. **Get your secret key:**
   - Go to: https://dashboard.stripe.com/apikeys
   - Make sure you're in **LIVE mode** (not test mode)
   - Click "Reveal live key token" 
   - Copy the key (starts with `sk_live_...`)

2. **Add to Supabase:**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/secrets
   - Click "New secret"
   - Name: `STRIPE_SECRET_KEY`
   - Value: `sk_live_YOUR_SECRET_KEY_HERE` (paste your actual key)
   - Click "Create secret"

3. **Also add the publishable key** (for get-stripe-config function):
   - Name: `STRIPE_PUBLISHABLE_KEY`
   - Value: Your live publishable key (check .env file)

---

### Step 2: Sync Pricing to Stripe 💳

This creates your 4 subscription products in Stripe with correct prices.

**Option A: Use the test tool (easiest)**
1. Open `test-stripe-sync.html` in your browser
2. Click "🚀 Sync Pricing to Stripe"
3. Wait for success message
4. Verify in Stripe Dashboard

**Option B: Using browser console**
1. Start your dev server: `npm run dev`
2. Open your app in browser
3. Open browser console (F12)
4. Run this:
```javascript
fetch('https://YOUR_PROJECT.supabase.co/functions/v1/sync-pricing', {
  method: 'POST',
  headers: {
    'apikey': 'YOUR_SUPABASE_ANON_KEY',
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY'
  }
}).then(r => r.json()).then(console.log);
```

**Expected Result:**
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

**Verify in Stripe:**
- Go to: https://dashboard.stripe.com/products
- You should see 4 products created
- Each with 2 prices (monthly and yearly)

---

### Step 3: Configure Webhook 🔔

Webhooks allow Stripe to notify your app when payments succeed/fail.

1. **Go to Stripe Webhooks:**
   - https://dashboard.stripe.com/webhooks (LIVE mode)

2. **Click "+ Add endpoint"**

3. **Configure endpoint:**
   - Endpoint URL: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
   - Description: "Entity Renewal Pro Subscriptions"
   
4. **Select events to listen for:**
   - ✅ `checkout.session.completed`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`

5. **Click "Add endpoint"**

6. **Copy the webhook secret:**
   - Click on your new endpoint
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_...`)

7. **Add to Supabase:**
   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/secrets
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_YOUR_WEBHOOK_SECRET_HERE`

---

### Step 4: Test the Subscription Flow 🧪

⚠️ **WARNING:** Since you're using live keys, this will charge a real card!

**Recommendation:** Test with a small amount and immediately refund.

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Navigate to billing page:**
   ```
   http://localhost:5173/billing
   ```

3. **Choose a tier** (suggest Starter at $19/mo for testing)

4. **Complete checkout with real card**
   - Use a real credit card
   - Complete the payment

5. **Verify subscription:**
   - Check that your app shows "Active Subscription"
   - Check Stripe Dashboard → Customers
   - Check Stripe Dashboard → Subscriptions

6. **Immediately cancel and refund** (if just testing):
   - Stripe Dashboard → Subscriptions → Cancel subscription
   - Stripe Dashboard → Payments → Refund

---

## 🔍 Troubleshooting

### "Price not found for lookup_key"
**Cause:** Products haven't been created in Stripe yet  
**Solution:** Run Step 2 (sync-pricing)

### "STRIPE_SECRET_KEY is not configured"
**Cause:** Secret key not in Supabase  
**Solution:** Complete Step 1

### "Webhook signature verification failed"
**Cause:** Webhook secret not configured  
**Solution:** Complete Step 3

### Subscription status not updating after payment
**Cause:** Webhook not receiving events  
**Solution:** 
- Check webhook logs in Stripe Dashboard
- Verify webhook endpoint is correct
- Check Supabase function logs

---

## 📊 Subscription Tiers (Now Configured)

| Tier | Monthly | Yearly | Entities | Savings |
|------|---------|--------|----------|---------|
| Starter | $19 | $191 | 4 | $37/year |
| Growth | $49 | $492 | 20 | $96/year |
| Professional | $99 | $994 | 50 | $194/year |
| Enterprise | $249 | $2500 | 150 | $488/year |

---

## 🎯 Success Criteria

You'll know it's working when:
- ✅ 4 products visible in Stripe Dashboard
- ✅ Checkout modal opens when clicking "Choose Plan"
- ✅ Payment processes successfully
- ✅ Subscription status updates in your app
- ✅ Webhooks receive events in Stripe Dashboard
- ✅ Database shows subscription info

---

## 📚 Documentation Reference

- **STRIPE_SETUP_COMPLETE.md** - Complete setup guide
- **STRIPE_FIX_SUMMARY.md** - What was fixed
- **LIVE_STRIPE_SETUP.md** - Live mode considerations
- **test-stripe-sync.html** - Testing tool

---

## 🆘 Need Help?

**Check logs:**
1. Supabase function logs: https://supabase.com/dashboard/project/YOUR_PROJECT/functions
2. Stripe webhook logs: https://dashboard.stripe.com/webhooks
3. Browser console (F12)

**Common resources:**
- Stripe API Docs: https://stripe.com/docs/api
- Stripe Dashboard: https://dashboard.stripe.com
- Supabase Dashboard: https://supabase.com/dashboard

---

**Current Status:** ⏳ Waiting for you to complete Step 1 (add secret key to Supabase)
