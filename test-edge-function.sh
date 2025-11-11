#!/bin/bash

# Test script for create-paid-registration edge function
# This script tests the edge function directly

echo "🧪 Testing create-paid-registration Edge Function"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="https://wcuxqopfcgivypbiynjp.supabase.co"
FUNCTION_URL="$SUPABASE_URL/functions/v1/create-paid-registration"

echo -e "${BLUE}📋 Test Configuration:${NC}"
echo "Function URL: $FUNCTION_URL"
echo ""

# Test data
TEST_DATA='{
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

echo -e "${YELLOW}🔍 Testing Edge Function...${NC}"
echo "Test Data: $TEST_DATA"
echo ""

# Test the function
echo -e "${YELLOW}📤 Sending request to edge function...${NC}"
RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(echo $SUPABASE_ANON_KEY)" \
  -d "$TEST_DATA")

echo -e "${BLUE}📥 Response received:${NC}"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if response contains clientSecret
if echo "$RESPONSE" | grep -q "clientSecret"; then
  echo -e "${GREEN}✅ Edge function is working correctly!${NC}"
  echo -e "${GREEN}✅ Payment intent created successfully${NC}"
else
  echo -e "${RED}❌ Edge function returned an error${NC}"
  
  # Check for specific error messages
  if echo "$RESPONSE" | grep -q "STRIPE_SECRET_KEY"; then
    echo -e "${RED}❌ STRIPE_SECRET_KEY is not configured${NC}"
    echo -e "${YELLOW}💡 Solution: Set STRIPE_SECRET_KEY in Supabase secrets${NC}"
  elif echo "$RESPONSE" | grep -q "Price not found"; then
    echo -e "${RED}❌ Stripe prices not configured${NC}"
    echo -e "${YELLOW}💡 Solution: Create products and prices in Stripe dashboard${NC}"
  elif echo "$RESPONSE" | grep -q "Invalid pricing tier"; then
    echo -e "${RED}❌ Invalid tier specified${NC}"
    echo -e "${YELLOW}💡 Solution: Use valid tier (starter, growth, professional, enterprise)${NC}"
  else
    echo -e "${RED}❌ Unknown error occurred${NC}"
  fi
fi

echo ""
echo -e "${BLUE}🔧 Troubleshooting Steps:${NC}"
echo "1. Check Supabase secrets:"
echo "   supabase secrets list"
echo ""
echo "2. Set Stripe secret key:"
echo "   supabase secrets set STRIPE_SECRET_KEY=sk_test_..."
echo ""
echo "3. Deploy the function:"
echo "   supabase functions deploy create-paid-registration"
echo ""
echo "4. Check function logs:"
echo "   supabase functions logs create-paid-registration"
echo ""
echo -e "${BLUE}📝 Manual Testing:${NC}"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to Edge Functions"
echo "3. Check if create-paid-registration is deployed"
echo "4. View function logs for errors"
echo "5. Test the function with the provided test data"
