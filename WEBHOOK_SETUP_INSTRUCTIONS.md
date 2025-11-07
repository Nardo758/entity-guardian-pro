# Stripe Webhook Setup Instructions

Your Stripe CLI is now logged in and ready! However, webhook endpoint creation needs to be done through the Stripe Dashboard.

## Steps to Create Webhook:

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com/webhooks

2. **Add New Endpoint**
   - Click the "+ Add endpoint" button

3. **Configure Endpoint**
   - **Endpoint URL**: `https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook`
   - **Description**: Entity Renewal Pro Subscriptions

4. **Select Events to Listen For**
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

5. **Save and Get Signing Secret**
   - Click "Add endpoint"
   - Copy the **Signing secret** (starts with `whsec_`)

6. **Add Secret to Supabase**
   - Go to: https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/settings/secrets
   - Click "New secret"
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: Paste the signing secret from step 5
   - Click "Create secret"

## Testing Your Webhook

Once setup is complete, you can test with:

```bash
C:\Users\Leon\Documents\stripe.exe trigger checkout.session.completed
```

## Stripe CLI is Ready For:

- ✅ Testing webhooks locally with `stripe listen`
- ✅ Triggering test events with `stripe trigger`
- ✅ Viewing API logs with `stripe logs tail`
- ✅ Making API requests with `stripe get`, `stripe customers`, etc.

Your Stripe CLI session will expire in 90 days.
