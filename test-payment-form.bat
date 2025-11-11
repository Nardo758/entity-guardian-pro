@echo off
echo 🧪 Testing Payment Form Loading
echo ==============================
echo.

echo 📋 Testing Steps:
echo 1. Go to http://localhost:5173/paid-register
echo 2. Fill out Step 1 (Account Information)
echo 3. Fill out Step 2 (Plan & Security)
echo 4. Click "Proceed to Payment"
echo 5. Check if payment form loads
echo.

echo 🔍 Expected Behavior:
echo ✅ If Stripe is configured: Real Stripe payment form
echo ✅ If Stripe is not configured: Mock payment form
echo ✅ Either way: Payment form should load
echo.

echo 🚨 If "Loading payment form..." shows forever:
echo 1. Check browser console for errors
echo 2. Check if clientSecret is received
echo 3. Check if mock payment form appears
echo.

echo 💡 Solutions:
echo - Real Stripe: Configure STRIPE_SECRET_KEY
echo - Development: Mock payment form should appear
echo - Debug: Check browser console
echo.

pause
