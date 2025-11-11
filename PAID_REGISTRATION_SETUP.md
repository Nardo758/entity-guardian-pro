# Entity Guardian Pro - Paid Registration Setup Guide

## 🎯 Overview

This guide will help you set up the complete paid registration flow with Stripe integration for Entity Guardian Pro. The system includes:

- ✅ **3-Step Registration Process**
- ✅ **Stripe Payment Integration**
- ✅ **Supabase Edge Functions**
- ✅ **Secure Payment Processing**
- ✅ **User Account Creation**
- ✅ **Subscription Management**

## 🚀 Quick Start

### 1. Prerequisites

Make sure you have the following installed:
- Node.js (v18+)
- npm or bun
- Supabase CLI
- Stripe Account

### 2. Environment Setup

#### Supabase Environment Variables
Set these in your Supabase project secrets:

```bash
# Supabase CLI
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Local Environment Variables
Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Stripe Configuration

#### Stripe Dashboard Setup
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Enable **Payment Intents** in your account settings
3. Create products and prices for your subscription tiers:
   - Starter: $19/month, $191/year
   - Growth: $49/month, $492/year  
   - Professional: $99/month, $994/year
   - Enterprise: $249/month, $2500/year

#### Stripe Webhook Setup
1. Go to Webhooks in Stripe Dashboard
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the webhook signing secret

### 4. Database Setup

#### Required Tables
The system uses these Supabase tables:
- `users` (managed by Supabase Auth)
- `subscriptions` (for subscription management)
- `business_owners` (for user profile data)

#### Migration Files
Run the database migrations:

```bash
supabase db push
```

### 5. Edge Functions Deployment

Deploy the required edge functions:

```bash
# Deploy all functions
supabase functions deploy create-paid-registration
supabase functions deploy complete-paid-registration
supabase functions deploy get-stripe-config
supabase functions deploy stripe-webhook
```

## 🔧 Implementation Details

### Registration Flow

#### Step 1: Account Information
- First Name, Last Name
- Email Address
- Company Name
- Company Size

#### Step 2: Plan & Security
- Plan Selection (Starter, Growth, Professional, Enterprise)
- Billing Period (Monthly/Yearly)
- Password Creation
- Terms & Conditions Agreement

#### Step 3: Payment
- Payment Summary
- Stripe Payment Form
- Secure Payment Processing

### Key Components

#### Frontend Components
- `PaidRegister.tsx` - Main registration component
- `RegistrationSuccess.tsx` - Success page
- `PlanSelector.tsx` - Plan selection component
- `PaymentForm.tsx` - Stripe payment form
- `StripeProvider.tsx` - Stripe context provider

#### Backend Functions
- `create-paid-registration` - Creates payment intent
- `complete-paid-registration` - Completes registration after payment
- `get-stripe-config` - Returns Stripe configuration
- `stripe-webhook` - Handles Stripe webhooks

### Security Features

- ✅ **Secure Key Management** - No hardcoded keys
- ✅ **Input Validation** - Comprehensive validation
- ✅ **Rate Limiting** - Prevents abuse
- ✅ **Error Handling** - User-friendly error messages
- ✅ **Transaction Safety** - Rollback on failures

## 🧪 Testing

### Automated Testing
Run the test script:

```bash
./test-paid-registration.sh
```

### Manual Testing Checklist

1. **Registration Flow**
   - [ ] Navigate to `/paid-register`
   - [ ] Complete Step 1 (Account Information)
   - [ ] Complete Step 2 (Plan & Security)
   - [ ] Complete Step 3 (Payment)
   - [ ] Verify redirect to `/registration-success`

2. **Error Handling**
   - [ ] Test invalid email format
   - [ ] Test password mismatch
   - [ ] Test payment failure
   - [ ] Test network errors

3. **Payment Testing**
   - [ ] Use Stripe test cards
   - [ ] Test successful payment
   - [ ] Test declined payment
   - [ ] Test 3D Secure authentication

### Stripe Test Cards

```
# Successful payments
4242424242424242 - Visa
4000056655665556 - Visa (debit)
5555555555554444 - Mastercard

# Declined payments
4000000000000002 - Card declined
4000000000009995 - Insufficient funds
4000000000009987 - Lost card
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Payment Intent Creation Fails
**Error**: "Failed to initialize payment"
**Solution**: 
- Check Stripe secret key in Supabase secrets
- Verify edge function deployment
- Check function logs in Supabase dashboard

#### 2. Stripe Elements Not Loading
**Error**: "Stripe is not ready"
**Solution**:
- Check Stripe publishable key
- Verify `get-stripe-config` function
- Check browser console for errors

#### 3. Registration Completion Fails
**Error**: "Failed to complete registration"
**Solution**:
- Check payment intent status
- Verify user creation permissions
- Check database constraints

### Debug Mode

Enable debug logging by adding to your component:

```typescript
// Add to PaidRegister.tsx
const DEBUG = true;

if (DEBUG) {
  console.log('Debug info:', { formData, selectedPlan, selectedBilling });
}
```

## 📊 Monitoring

### Supabase Dashboard
- Monitor edge function logs
- Check database performance
- Review authentication metrics

### Stripe Dashboard
- Monitor payment success rates
- Check webhook delivery
- Review customer metrics

## 🔄 Updates & Maintenance

### Regular Tasks
1. **Monitor Payment Success Rates**
2. **Check Edge Function Logs**
3. **Update Stripe API Versions**
4. **Review Security Settings**

### Version Updates
When updating Stripe or Supabase:
1. Test in staging environment
2. Update edge functions
3. Verify webhook endpoints
4. Test payment flow

## 📞 Support

### Getting Help
- Check Supabase logs for edge function errors
- Review Stripe dashboard for payment issues
- Use browser dev tools for frontend debugging

### Contact Information
- Technical Support: support@entityrenewalpro.com
- Stripe Support: [Stripe Support Center](https://support.stripe.com)
- Supabase Support: [Supabase Support](https://supabase.com/support)

## 🎉 Success!

Once everything is set up correctly, users will be able to:

1. **Register** with their business information
2. **Select** a subscription plan
3. **Pay** securely with Stripe
4. **Access** their dashboard immediately

The system handles all the complexity behind the scenes, providing a smooth user experience for paid registrations.

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Compatibility**: Stripe API v2023-10-16, Supabase v1.0+
