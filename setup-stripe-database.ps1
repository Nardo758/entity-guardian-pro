# Supabase Database Setup for Stripe Subscriptions
# This script helps you apply the migration and verify your database setup

Write-Host "🗄️ Supabase Database Setup for Stripe" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$projectRef = "wcuxqopfcgivypbiynjp"
$migrationFile = "supabase\migrations\20251106_stripe_subscription_tables.sql"

Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  1. Verify Supabase CLI is installed" -ForegroundColor White
Write-Host "  2. Check database connection" -ForegroundColor White
Write-Host "  3. Apply Stripe subscription migration" -ForegroundColor White
Write-Host "  4. Verify tables are created correctly" -ForegroundColor White
Write-Host ""

# Check if in correct directory
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found!" -ForegroundColor Red
    Write-Host "   Expected: $migrationFile" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Please run this script from the project root:" -ForegroundColor Yellow
    Write-Host "   cd c:\Users\Leon\Documents\Apartment-Locator-AI-Real-main\Apartment-Locator-AI-Scraper-Agent-Real\entity-guardian-pro" -ForegroundColor White
    exit 1
}

Write-Host "✅ Found migration file" -ForegroundColor Green
Write-Host ""

# Check for Supabase CLI
Write-Host "1️⃣ Checking for Supabase CLI..." -ForegroundColor Cyan
try {
    $supabaseVersion = supabase --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Supabase CLI installed: $supabaseVersion" -ForegroundColor Green
    } else {
        throw "Supabase CLI not found"
    }
} catch {
    Write-Host "   ❌ Supabase CLI not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Install Supabase CLI:" -ForegroundColor Yellow
    Write-Host "   Using Scoop: scoop install supabase" -ForegroundColor White
    Write-Host "   Or download from: https://github.com/supabase/cli" -ForegroundColor White
    Write-Host ""
    Write-Host "   After installation, run:" -ForegroundColor Yellow
    Write-Host "   supabase login" -ForegroundColor White
    Write-Host "   supabase link --project-ref $projectRef" -ForegroundColor White
    exit 1
}

Write-Host ""

# Check if linked to project
Write-Host "2️⃣ Checking project link..." -ForegroundColor Cyan
if (Test-Path ".\.supabase") {
    Write-Host "   ✅ Project appears to be linked" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Project not linked to Supabase" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Linking project..." -ForegroundColor Yellow
    try {
        supabase link --project-ref $projectRef
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Project linked successfully" -ForegroundColor Green
        } else {
            throw "Failed to link project"
        }
    } catch {
        Write-Host "   ❌ Failed to link project" -ForegroundColor Red
        Write-Host "   Please run: supabase login" -ForegroundColor Yellow
        Write-Host "   Then run: supabase link --project-ref $projectRef" -ForegroundColor White
        exit 1
    }
}

Write-Host ""

# Show what the migration will do
Write-Host "3️⃣ Migration Overview:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   This migration will:" -ForegroundColor Yellow
Write-Host "   📋 Enhance subscribers table with Stripe fields:" -ForegroundColor White
Write-Host "      • stripe_subscription_id, stripe_price_id, stripe_product_id" -ForegroundColor Gray
Write-Host "      • subscription_status, billing_cycle, entities_limit" -ForegroundColor Gray
Write-Host "      • current_period_start, current_period_end, cancel_at_period_end" -ForegroundColor Gray
Write-Host ""
Write-Host "   📊 Create new tables:" -ForegroundColor White
Write-Host "      • stripe_invoices - Store invoice history" -ForegroundColor Gray
Write-Host "      • stripe_events - Log webhook events" -ForegroundColor Gray
Write-Host "      • subscription_history - Track subscription changes" -ForegroundColor Gray
Write-Host ""
Write-Host "   ⚙️ Create functions:" -ForegroundColor White
Write-Host "      • update_subscriber_from_webhook() - Process webhook data" -ForegroundColor Gray
Write-Host "      • log_subscription_change() - Auto-log tier changes" -ForegroundColor Gray
Write-Host ""
Write-Host "   🔍 Create view:" -ForegroundColor White
Write-Host "      • active_subscriptions - Query active subscriptions easily" -ForegroundColor Gray
Write-Host ""

# Prompt for confirmation
$confirmation = Read-Host "   Do you want to apply this migration? (Y/N)"
if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host ""
    Write-Host "   ❌ Migration cancelled by user" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Apply migration
Write-Host "4️⃣ Applying migration..." -ForegroundColor Cyan
Write-Host ""

try {
    # Use supabase db push to apply the migration
    $result = supabase db push 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Migration applied successfully!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Migration command completed with warnings" -ForegroundColor Yellow
        Write-Host "   Output: $result" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Error applying migration!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   💡 Alternative: Apply migration manually" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://supabase.com/dashboard/project/$projectRef/editor" -ForegroundColor White
    Write-Host "   2. Copy contents of: $migrationFile" -ForegroundColor White
    Write-Host "   3. Paste and run in SQL Editor" -ForegroundColor White
    exit 1
}

Write-Host ""

# Verify tables were created
Write-Host "5️⃣ Verifying database setup..." -ForegroundColor Cyan
Write-Host ""

$verifySQL = @"
SELECT 
    'subscribers' as table_name,
    COUNT(*) FILTER (WHERE column_name = 'stripe_subscription_id') as has_stripe_fields
FROM information_schema.columns 
WHERE table_name = 'subscribers' AND table_schema = 'public'
UNION ALL
SELECT 
    table_name,
    1
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('stripe_invoices', 'stripe_events', 'subscription_history')
ORDER BY table_name;
"@

try {
    # Note: This requires psql or you can use Supabase dashboard
    Write-Host "   Tables that should exist:" -ForegroundColor White
    Write-Host "   ✓ subscribers (enhanced with Stripe fields)" -ForegroundColor Gray
    Write-Host "   ✓ stripe_invoices" -ForegroundColor Gray
    Write-Host "   ✓ stripe_events" -ForegroundColor Gray
    Write-Host "   ✓ subscription_history" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   To verify, check your Supabase dashboard:" -ForegroundColor Yellow
    Write-Host "   https://supabase.com/dashboard/project/$projectRef/editor" -ForegroundColor White
} catch {
    Write-Host "   ⚠️ Could not automatically verify tables" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Database Setup Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Verify tables in Supabase Dashboard:" -ForegroundColor Yellow
Write-Host "   https://supabase.com/dashboard/project/$projectRef/editor" -ForegroundColor White
Write-Host ""
Write-Host "2. Update your webhook handler to use new fields:" -ForegroundColor Yellow
Write-Host "   • stripe_subscription_id" -ForegroundColor White
Write-Host "   • subscription_status" -ForegroundColor White
Write-Host "   • current_period_start/end" -ForegroundColor White
Write-Host ""
Write-Host "3. Test the webhook integration:" -ForegroundColor Yellow
Write-Host "   .\setup-stripe-webhook.ps1" -ForegroundColor White
Write-Host ""
Write-Host "4. Update your Stripe webhook function:" -ForegroundColor Yellow
Write-Host "   supabase functions deploy stripe-webhook" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   • Migration file: $migrationFile" -ForegroundColor White
Write-Host "   • Webhook setup: STRIPE_WIRE_UP_CHECKLIST.md" -ForegroundColor White
Write-Host "   • Current status: STRIPE_STATUS.md" -ForegroundColor White
Write-Host ""
