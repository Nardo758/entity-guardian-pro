#!/bin/bash

# Email Confirmation Fix Deployment Script
echo "🚀 Deploying Email Confirmation Fix..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    echo "Install with: npm install -g supabase"
    exit 1
fi

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please login first."
    echo "Login with: supabase login"
    exit 1
fi

echo "📋 Step 1: Running database migrations..."
supabase db push

echo "📋 Step 2: Deploying send-auth-email function..."
supabase functions deploy send-auth-email

echo "📋 Step 3: Checking function status..."
supabase functions list

echo "✅ Deployment complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Set RESEND_API_KEY environment variable in Supabase Dashboard"
echo "2. Go to Edge Functions > send-auth-email > Settings > Environment Variables"
echo "3. Add RESEND_API_KEY with your Resend API key"
echo "4. Test signup flow to verify email confirmation works"
echo ""
echo "📧 To test:"
echo "1. Create a new account"
echo "2. Check email inbox for confirmation email"
echo "3. Click confirmation link"
echo "4. Try signing in"
