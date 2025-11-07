# Simple Stripe Webhook Setup
$stripePath = "C:\Users\Leon\Documents\stripe.exe"
$webhookUrl = "https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/stripe-webhook"
$events = "checkout.session.completed,invoice.payment_succeeded,invoice.payment_failed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted"

Write-Host "Creating Stripe webhook..." -ForegroundColor Cyan
Write-Host ""

& $stripePath webhooks create --url $webhookUrl --description "Entity Renewal Pro Subscriptions" --enabled-event $events

Write-Host ""
Write-Host "Done! Copy the webhook signing secret (whsec_...) and add it to Supabase secrets as STRIPE_WEBHOOK_SECRET" -ForegroundColor Yellow
