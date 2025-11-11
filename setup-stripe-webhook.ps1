# Stripe Webhook Setup Script
# This script creates a webhook endpoint in Stripe for your subscription events

Write-Host "🔧 Stripe Webhook Setup" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$webhookUrl = "https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook"
$description = "Entity Renewal Pro Subscriptions"

# Events to listen for
$events = @(
    "checkout.session.completed",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted"
)

Write-Host "This script will create a webhook endpoint in Stripe with:" -ForegroundColor Yellow
Write-Host "  • URL: $webhookUrl" -ForegroundColor White
Write-Host "  • Description: $description" -ForegroundColor White
Write-Host "  • Events: $($events.Count) subscription events" -ForegroundColor White
Write-Host ""

# Check if Stripe CLI is installed
Write-Host "Checking for Stripe CLI..." -ForegroundColor Cyan
$stripePath = "C:\Users\Leon\Documents\stripe.exe"

if (-not (Test-Path $stripePath)) {
    Write-Host "❌ Stripe CLI not found at: $stripePath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Stripe CLI first:" -ForegroundColor Yellow
    Write-Host "  1. Using Scoop: scoop install stripe" -ForegroundColor White
    Write-Host "  2. Or download from: https://stripe.com/docs/stripe-cli" -ForegroundColor White
    Write-Host ""
    Write-Host "After installation, run: stripe login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Stripe CLI found at: $stripePath" -ForegroundColor Green
Write-Host ""

# Set alias for stripe command
Set-Alias -Name stripe -Value $stripePath

# Check if logged in
Write-Host "Checking Stripe authentication..." -ForegroundColor Cyan
$loginCheck = stripe config --list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Stripe!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run: stripe login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Authenticated with Stripe" -ForegroundColor Green
Write-Host ""

# Create webhook endpoint
Write-Host "Creating webhook endpoint..." -ForegroundColor Cyan
Write-Host ""

$eventsParam = $events -join ","

try {
    # Create the webhook
    $result = stripe webhooks create `
        --url $webhookUrl `
        --description "$description" `
        --enabled-event $eventsParam `
        --format json 2>&1

    if ($LASTEXITCODE -eq 0) {
        $webhook = $result | ConvertFrom-Json
        
        Write-Host "✅ Webhook endpoint created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "📋 Webhook Details" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  Webhook ID: $($webhook.id)" -ForegroundColor White
        Write-Host "  URL: $($webhook.url)" -ForegroundColor White
        Write-Host "  Status: $($webhook.status)" -ForegroundColor Green
        Write-Host ""
        Write-Host "  🔑 Signing Secret:" -ForegroundColor Yellow
        Write-Host "  $($webhook.secret)" -ForegroundColor White
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📝 Next Steps:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Copy the signing secret above (starts with whsec_)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "2. Add it to Supabase secrets:" -ForegroundColor Yellow
        Write-Host "   • Go to: https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/settings/secrets" -ForegroundColor White
        Write-Host "   • Click 'New secret'" -ForegroundColor White
        Write-Host "   • Name: STRIPE_WEBHOOK_SECRET" -ForegroundColor White
        Write-Host "   • Value: $($webhook.secret)" -ForegroundColor White
        Write-Host "   • Click 'Create secret'" -ForegroundColor White
        Write-Host ""
        Write-Host "3. Test your webhook:" -ForegroundColor Yellow
        Write-Host "   stripe webhooks trigger checkout.session.completed" -ForegroundColor White
        Write-Host ""
        Write-Host "✅ Setup complete! Your webhook is ready to receive events." -ForegroundColor Green
        
    } else {
        throw "Failed to create webhook: $result"
    }
    
} catch {
    Write-Host "❌ Error creating webhook!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Create webhook manually" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Go to: https://dashboard.stripe.com/webhooks" -ForegroundColor White
    Write-Host "2. Click '+ Add endpoint'" -ForegroundColor White
    Write-Host "3. Enter URL: $webhookUrl" -ForegroundColor White
    Write-Host "4. Select these events:" -ForegroundColor White
    foreach ($event in $events) {
        Write-Host "   • $event" -ForegroundColor Gray
    }
    Write-Host "5. Click 'Add endpoint'" -ForegroundColor White
    Write-Host "6. Copy the signing secret and add to Supabase" -ForegroundColor White
    exit 1
}

Write-Host ""
