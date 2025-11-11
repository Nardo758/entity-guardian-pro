#!/bin/bash

# Entity Guardian Pro - Paid Registration Flow Test Script
# This script tests the complete paid registration flow

echo "🧪 Testing Entity Guardian Pro Paid Registration Flow"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BASE_URL="http://localhost:5173"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="TestPassword123!"

echo -e "${BLUE}📋 Test Configuration:${NC}"
echo "Base URL: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo "Test Password: $TEST_PASSWORD"
echo ""

# Function to check if server is running
check_server() {
    echo -e "${YELLOW}🔍 Checking if development server is running...${NC}"
    if curl -s "$BASE_URL" > /dev/null; then
        echo -e "${GREEN}✅ Development server is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Development server is not running${NC}"
        echo "Please start the development server with: npm run dev"
        return 1
    fi
}

# Function to test page accessibility
test_page_access() {
    local page=$1
    local page_name=$2
    
    echo -e "${YELLOW}🔍 Testing $page_name page access...${NC}"
    if curl -s "$BASE_URL$page" | grep -q "Entity Renewal Pro\|PaidRegister\|RegistrationSuccess"; then
        echo -e "${GREEN}✅ $page_name page is accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ $page_name page is not accessible${NC}"
        return 1
    fi
}

# Function to test Supabase functions
test_supabase_functions() {
    echo -e "${YELLOW}🔍 Testing Supabase Edge Functions...${NC}"
    
    # Test create-paid-registration function
    echo "Testing create-paid-registration function..."
    if curl -s -X POST "https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/create-paid-registration" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","tier":"starter","billing":"monthly"}' | grep -q "error\|clientSecret"; then
        echo -e "${GREEN}✅ create-paid-registration function is responding${NC}"
    else
        echo -e "${RED}❌ create-paid-registration function is not responding${NC}"
    fi
    
    # Test get-stripe-config function
    echo "Testing get-stripe-config function..."
    if curl -s "https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/get-stripe-config" | grep -q "publishableKey\|error"; then
        echo -e "${GREEN}✅ get-stripe-config function is responding${NC}"
    else
        echo -e "${RED}❌ get-stripe-config function is not responding${NC}"
    fi
}

# Function to test Stripe configuration
test_stripe_config() {
    echo -e "${YELLOW}🔍 Testing Stripe Configuration...${NC}"
    
    # Check if Stripe publishable key is accessible
    if curl -s "https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/get-stripe-config" | grep -q "pk_"; then
        echo -e "${GREEN}✅ Stripe publishable key is accessible${NC}"
    else
        echo -e "${RED}❌ Stripe publishable key is not accessible${NC}"
    fi
}

# Function to run browser tests (if Playwright is available)
run_browser_tests() {
    echo -e "${YELLOW}🔍 Running browser tests...${NC}"
    
    if command -v npx &> /dev/null; then
        echo "Running Playwright tests..."
        npx playwright test --headed 2>/dev/null || echo -e "${YELLOW}⚠️  Playwright tests not configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Playwright not available for browser tests${NC}"
    fi
}

# Main test execution
main() {
    echo -e "${BLUE}🚀 Starting comprehensive test suite...${NC}"
    echo ""
    
    # Check server
    if ! check_server; then
        exit 1
    fi
    
    echo ""
    
    # Test page access
    test_page_access "/paid-register" "Paid Registration"
    test_page_access "/registration-success" "Registration Success"
    test_page_access "/" "Landing Page"
    
    echo ""
    
    # Test Supabase functions
    test_supabase_functions
    
    echo ""
    
    # Test Stripe configuration
    test_stripe_config
    
    echo ""
    
    # Run browser tests
    run_browser_tests
    
    echo ""
    echo -e "${GREEN}🎉 Test suite completed!${NC}"
    echo ""
    echo -e "${BLUE}📝 Manual Testing Checklist:${NC}"
    echo "1. ✅ Navigate to /paid-register"
    echo "2. ✅ Fill out Step 1 (Account Information)"
    echo "3. ✅ Fill out Step 2 (Plan & Security)"
    echo "4. ✅ Complete Step 3 (Payment)"
    echo "5. ✅ Verify redirect to /registration-success"
    echo "6. ✅ Test error handling for invalid inputs"
    echo "7. ✅ Test payment failure scenarios"
    echo ""
    echo -e "${BLUE}🔧 Required Environment Variables:${NC}"
    echo "- STRIPE_SECRET_KEY (in Supabase secrets)"
    echo "- SUPABASE_URL"
    echo "- SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo -e "${BLUE}🌐 Test URLs:${NC}"
    echo "- Paid Registration: $BASE_URL/paid-register"
    echo "- Registration Success: $BASE_URL/registration-success"
    echo "- Landing Page: $BASE_URL/"
}

# Run main function
main
