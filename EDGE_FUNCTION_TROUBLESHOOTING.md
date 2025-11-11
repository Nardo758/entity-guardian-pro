# 🔧 Edge Function Error Troubleshooting Guide

## Error: "Edge Function returned a non-2xx status code"

This error occurs when the Supabase edge function fails to execute properly. Here are the most common causes and solutions:

## 🚨 Common Causes & Solutions

### 1. **STRIPE_SECRET_KEY Not Configured**
**Error Message**: "STRIPE_SECRET_KEY is not configured"

**Solution**:
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Set the Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Deploy the function
supabase functions deploy create-paid-registration
```

### 2. **Stripe Prices Not Found**
**Error Message**: "Price not found for lookup_key"

**Solution**:
- The function now has fallback pricing, so this should work automatically
- If you want to use Stripe prices, create products in Stripe dashboard with lookup keys:
  - `erp:starter:monthly`
  - `erp:starter:yearly`
  - `erp:growth:monthly`
  - `erp:growth:yearly`
  - `erp:professional:monthly`
  - `erp:professional:yearly`
  - `erp:enterprise:monthly`
  - `erp:enterprise:yearly`

### 3. **Invalid Tier**
**Error Message**: "Invalid pricing tier"

**Solution**:
- Make sure you're using one of these valid tiers:
  - `starter`
  - `growth`
  - `professional`
  - `enterprise`

### 4. **Function Not Deployed**
**Error Message**: "Function not found"

**Solution**:
```bash
# Deploy the function
supabase functions deploy create-paid-registration

# Check deployment status
supabase functions list
```

### 5. **CORS Issues**
**Error Message**: CORS-related errors

**Solution**:
- The function includes CORS headers
- Make sure you're calling from the correct domain

## 🧪 Testing Steps

### Step 1: Test Edge Function Directly
```bash
# Run the test script
chmod +x test-edge-function.sh
./test-edge-function.sh
```

### Step 2: Check Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to "Edge Functions"
3. Check if `create-paid-registration` is deployed
4. View function logs for detailed error messages

### Step 3: Test with Browser Console
1. Open browser developer tools
2. Go to `/paid-register` page
3. Fill out the form and try to proceed to Step 3
4. Check console for detailed error messages

## 🔍 Debug Information

### Check Function Logs
```bash
# View function logs
supabase functions logs create-paid-registration

# View logs in real-time
supabase functions logs create-paid-registration --follow
```

### Test Function Manually
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/create-paid-registration" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "userData": {
      "first_name": "John",
      "last_name": "Doe",
      "company": "Test Company",
      "company_size": "1-10"
    },
    "tier": "starter",
    "billing": "monthly"
  }'
```

## 🛠️ Quick Fixes

### Fix 1: Update Edge Function
The function has been updated with:
- ✅ Fallback pricing (no Stripe prices needed)
- ✅ Better error handling
- ✅ Support for "growth" tier
- ✅ Improved logging

### Fix 2: Environment Variables
Make sure these are set in Supabase secrets:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Fix 3: Redeploy Function
```bash
supabase functions deploy create-paid-registration
```

## 📞 Getting Help

### Check These First:
1. ✅ Supabase CLI installed
2. ✅ Function deployed
3. ✅ STRIPE_SECRET_KEY set
4. ✅ Valid tier selected
5. ✅ Network connection working

### If Still Not Working:
1. Check Supabase function logs
2. Test function directly with curl
3. Verify Stripe account is active
4. Check browser console for detailed errors

## 🎯 Expected Behavior

When working correctly, the function should:
1. ✅ Accept the registration data
2. ✅ Create a Stripe customer
3. ✅ Create a payment intent
4. ✅ Return a client secret
5. ✅ Allow payment form to load

## 📝 Test Data

Use this test data to verify the function:
```json
{
  "email": "test@example.com",
  "password": "TestPassword123!",
  "userData": {
    "first_name": "John",
    "last_name": "Doe",
    "company": "Test Company",
    "company_size": "1-10"
  },
  "tier": "starter",
  "billing": "monthly"
}
```

---

**Last Updated**: $(date)
**Status**: ✅ Fixed with fallback pricing and improved error handling
