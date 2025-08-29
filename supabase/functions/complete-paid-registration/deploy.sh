#!/bin/bash

# Deployment script for complete-paid-registration function
# This script applies database migrations and deploys the edge function

set -e

echo "🚀 Deploying complete-paid-registration function..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ This doesn't appear to be a Supabase project directory"
    echo "Please run this script from your project root"
    exit 1
fi

echo "📋 Checking project status..."
supabase status

echo "🗃️  Applying database migrations..."
# Apply the RPC function migration
supabase db push

echo "📦 Deploying edge function..."
# Deploy the function
supabase functions deploy complete-paid-registration

echo "🔧 Setting up environment variables..."
echo "Please ensure the following environment variables are set:"
echo "- SUPABASE_URL"
echo "- SUPABASE_SERVICE_ROLE_KEY" 
echo "- STRIPE_SECRET_KEY"
echo ""
echo "You can set them using:"
echo "supabase secrets set STRIPE_SECRET_KEY=sk_test_..."

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Set your environment variables"
echo "2. Test the function with the provided test file"
echo "3. Configure your Stripe webhook to call this function"
echo ""
echo "🔗 Function URL: https://[project-ref].supabase.co/functions/v1/complete-paid-registration"