@echo off
REM Test script for create-paid-registration edge function (Windows)
REM This script tests the edge function directly

echo 🧪 Testing create-paid-registration Edge Function
echo ================================================
echo.

REM Configuration
set SUPABASE_URL=https://wcuxqopfcgivypbiynjp.supabase.co
set FUNCTION_URL=%SUPABASE_URL%/functions/v1/create-paid-registration

echo 📋 Test Configuration:
echo Function URL: %FUNCTION_URL%
echo.

REM Test data
set TEST_DATA={"email": "test@example.com", "password": "TestPassword123!", "userData": {"first_name": "John", "last_name": "Doe", "company": "Test Company", "company_size": "1-10"}, "tier": "starter", "billing": "monthly"}

echo 🔍 Testing Edge Function...
echo Test Data: %TEST_DATA%
echo.

REM Test the function
echo 📤 Sending request to edge function...
curl -s -X POST "%FUNCTION_URL%" -H "Content-Type: application/json" -H "Authorization: Bearer %SUPABASE_ANON_KEY%" -d "%TEST_DATA%" > response.json

echo 📥 Response received:
type response.json
echo.

REM Check if response contains clientSecret
findstr /C:"clientSecret" response.json >nul
if %errorlevel% equ 0 (
    echo ✅ Edge function is working correctly!
    echo ✅ Payment intent created successfully
) else (
    echo ❌ Edge function returned an error
    
    REM Check for specific error messages
    findstr /C:"STRIPE_SECRET_KEY" response.json >nul
    if %errorlevel% equ 0 (
        echo ❌ STRIPE_SECRET_KEY is not configured
        echo 💡 Solution: Set STRIPE_SECRET_KEY in Supabase secrets
    )
    
    findstr /C:"Price not found" response.json >nul
    if %errorlevel% equ 0 (
        echo ❌ Stripe prices not configured
        echo 💡 Solution: Create products and prices in Stripe dashboard
    )
    
    findstr /C:"Invalid pricing tier" response.json >nul
    if %errorlevel% equ 0 (
        echo ❌ Invalid tier specified
        echo 💡 Solution: Use valid tier (starter, growth, professional, enterprise)
    )
)

echo.
echo 🔧 Troubleshooting Steps:
echo 1. Check Supabase secrets:
echo    supabase secrets list
echo.
echo 2. Set Stripe secret key:
echo    supabase secrets set STRIPE_SECRET_KEY=sk_test_...
echo.
echo 3. Deploy the function:
echo    supabase functions deploy create-paid-registration
echo.
echo 4. Check function logs:
echo    supabase functions logs create-paid-registration
echo.
echo 📝 Manual Testing:
echo 1. Go to your Supabase dashboard
echo 2. Navigate to Edge Functions
echo 3. Check if create-paid-registration is deployed
echo 4. View function logs for errors
echo 5. Test the function with the provided test data

REM Clean up
del response.json 2>nul

pause
