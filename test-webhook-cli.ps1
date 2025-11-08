# Test Stripe Webhook with CLI
# Run this script to test your webhook integration

$STRIPE_CLI = "C:\Users\Leon\Documents\stripe.exe"
$WEBHOOK_URL = "https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook"

Write-Host "🧪 Testing Stripe Webhook Integration" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check if Stripe CLI is available
if (-not (Test-Path $STRIPE_CLI)) {
    Write-Host "❌ Stripe CLI not found at: $STRIPE_CLI" -ForegroundColor Red
    Write-Host "   Please check the path and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Stripe CLI found" -ForegroundColor Green
Write-Host ""

# Menu
Write-Host "Choose a test:" -ForegroundColor White
Write-Host "  1. Quick Test - checkout.session.completed" -ForegroundColor White
Write-Host "  2. Subscription Lifecycle (create, update, delete)" -ForegroundColor White
Write-Host "  3. Payment Success" -ForegroundColor White
Write-Host "  4. Payment Failure" -ForegroundColor White
Write-Host "  5. All Events (comprehensive test)" -ForegroundColor White
Write-Host "  6. Listen and Forward (real-time)" -ForegroundColor White
Write-Host "  7. Get Webhook Secret" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-7)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🎯 Sending checkout.session.completed event..." -ForegroundColor Cyan
        & $STRIPE_CLI trigger checkout.session.completed
        Write-Host ""
        Write-Host "✅ Event sent! Check your database:" -ForegroundColor Green
        Write-Host "   SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 1;" -ForegroundColor Gray
    }
    
    "2" {
        Write-Host ""
        Write-Host "🔄 Testing subscription lifecycle..." -ForegroundColor Cyan
        
        Write-Host "  1/3 - Creating subscription..." -ForegroundColor White
        & $STRIPE_CLI trigger customer.subscription.created
        Start-Sleep -Seconds 2
        
        Write-Host "  2/3 - Updating subscription..." -ForegroundColor White
        & $STRIPE_CLI trigger customer.subscription.updated
        Start-Sleep -Seconds 2
        
        Write-Host "  3/3 - Deleting subscription..." -ForegroundColor White
        & $STRIPE_CLI trigger customer.subscription.deleted
        
        Write-Host ""
        Write-Host "✅ Lifecycle test complete! Check:" -ForegroundColor Green
        Write-Host "   SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 3;" -ForegroundColor Gray
    }
    
    "3" {
        Write-Host ""
        Write-Host "💳 Sending invoice.payment_succeeded event..." -ForegroundColor Cyan
        & $STRIPE_CLI trigger invoice.payment_succeeded
        Write-Host ""
        Write-Host "✅ Event sent! Check:" -ForegroundColor Green
        Write-Host "   SELECT * FROM stripe_invoices ORDER BY created_at DESC LIMIT 1;" -ForegroundColor Gray
    }
    
    "4" {
        Write-Host ""
        Write-Host "❌ Sending invoice.payment_failed event..." -ForegroundColor Cyan
        & $STRIPE_CLI trigger invoice.payment_failed
        Write-Host ""
        Write-Host "✅ Event sent! Check if subscription_status changed to 'past_due':" -ForegroundColor Green
        Write-Host "   SELECT * FROM subscribers WHERE subscription_status = 'past_due';" -ForegroundColor Gray
    }
    
    "5" {
        Write-Host ""
        Write-Host "🎪 Running comprehensive test suite..." -ForegroundColor Cyan
        Write-Host ""
        
        $events = @(
            "checkout.session.completed",
            "customer.subscription.created",
            "customer.subscription.updated",
            "invoice.payment_succeeded",
            "invoice.payment_failed",
            "customer.subscription.deleted"
        )
        
        $i = 1
        foreach ($event in $events) {
            Write-Host "  $i/$($events.Count) - $event" -ForegroundColor White
            & $STRIPE_CLI trigger $event
            Start-Sleep -Seconds 2
            $i++
        }
        
        Write-Host ""
        Write-Host "✅ All events sent! Verify in database:" -ForegroundColor Green
        Write-Host "   SELECT event_type, processed, created_at FROM stripe_events ORDER BY created_at DESC;" -ForegroundColor Gray
    }
    
    "6" {
        Write-Host ""
        Write-Host "📡 Starting event forwarding..." -ForegroundColor Cyan
        Write-Host "   Forwarding to: $WEBHOOK_URL" -ForegroundColor Gray
        Write-Host "   Press Ctrl+C to stop" -ForegroundColor Yellow
        Write-Host ""
        & $STRIPE_CLI listen --forward-to $WEBHOOK_URL
    }
    
    "7" {
        Write-Host ""
        Write-Host "🔐 Getting webhook signing secret..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Copy this secret and add to Supabase:" -ForegroundColor Yellow
        Write-Host "  1. Go to: https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/settings/secrets" -ForegroundColor Gray
        Write-Host "  2. Add secret: STRIPE_CLI_WEBHOOK_SECRET = <secret_below>" -ForegroundColor Gray
        Write-Host "  3. Redeploy: supabase functions deploy stripe-webhook" -ForegroundColor Gray
        Write-Host ""
        & $STRIPE_CLI listen --print-secret
    }
    
    default {
        Write-Host ""
        Write-Host "❌ Invalid choice. Please run again and choose 1-7." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Useful Links:" -ForegroundColor White
Write-Host "   Supabase Logs: https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/logs/edge-functions" -ForegroundColor Gray
Write-Host "   Stripe Events: https://dashboard.stripe.com/test/events" -ForegroundColor Gray
Write-Host "   SQL Editor:    https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/sql/new" -ForegroundColor Gray
Write-Host ""
