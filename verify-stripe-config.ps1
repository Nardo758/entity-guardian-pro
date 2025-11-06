# Stripe Configuration Verification Script for Entity Guardian Pro
# Run with: .\verify-stripe-config.ps1

$SUPABASE_URL = "https://wcuxqopfcgivypbiynjp.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdXhxb3BmY2dpdnlwYml5bmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNDI1NzMsImV4cCI6MjA3MTkxODU3M30.-RkbzPY_FZVd9qShJxi959LLSqWXYI7Mkqk1DqJVt6o"

Write-Host "🔍 Stripe Configuration Verification" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check Stripe Configuration
Write-Host "1️⃣ Testing check-stripe endpoint..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $SUPABASE_ANON_KEY"
        "apikey" = $SUPABASE_ANON_KEY
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/check-stripe" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.ok) {
        Write-Host "   ✅ Configuration Complete!" -ForegroundColor Green
        Write-Host "   - Publishable Key: Configured" -ForegroundColor Green
        Write-Host "   - Secret Key: Configured" -ForegroundColor Green
        Write-Host "   - Authorization: Valid" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Configuration Issues Found:" -ForegroundColor Red
        foreach ($issue in $result.issues) {
            Write-Host "      • $issue" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Get Stripe Config
Write-Host "2️⃣ Testing get-stripe-config endpoint..." -ForegroundColor Yellow
try {
    $headers = @{
        "apikey" = $SUPABASE_ANON_KEY
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/get-stripe-config" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    if ($result.publishableKey) {
        Write-Host "   ✅ Publishable key retrieved!" -ForegroundColor Green
        Write-Host "   Key: $($result.publishableKey.Substring(0, 20))..." -ForegroundColor Gray
    } else {
        Write-Host "   ❌ No publishable key returned" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you see ❌ errors above:" -ForegroundColor Yellow
Write-Host "1. Go to Supabase Secrets: https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/settings/secrets" -ForegroundColor White
Write-Host "2. Add these secrets:" -ForegroundColor White
Write-Host "   - STRIPE_PUBLISHABLE_KEY=pk_test_..." -ForegroundColor Gray
Write-Host "   - STRIPE_SECRET_KEY=sk_test_..." -ForegroundColor Gray
Write-Host "3. Redeploy functions: supabase functions deploy" -ForegroundColor White
Write-Host "4. Run this script again" -ForegroundColor White
Write-Host ""
Write-Host "If everything shows ✅:" -ForegroundColor Green
Write-Host "1. Open test-stripe-sync.html in your browser" -ForegroundColor White
Write-Host "2. Click 'Sync Pricing to Stripe'" -ForegroundColor White
Write-Host "3. Verify products in Stripe Dashboard" -ForegroundColor White
Write-Host ""
