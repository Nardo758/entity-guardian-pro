// Test script to check Stripe configuration
const testStripeConfig = async () => {
  console.log('🔍 Testing Stripe Configuration...\n');

  // Get Supabase URL and anon key from your project
  const SUPABASE_URL = 'https://wcuxqopfcgivypbiynjp.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdXhxb3BmY2dpdnlwYml5bmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNDI1NzMsImV4cCI6MjA3MTkxODU3M30.-RkbzPY_FZVd9qShJxi959LLSqWXYI7Mkqk1DqJVt6o';

  // Test 1: Check get-stripe-config edge function
  console.log('1. Testing get-stripe-config edge function...');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-stripe-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ get-stripe-config response:', data);
      
      if (data.publishableKey) {
        console.log('✅ Stripe publishable key found:', data.publishableKey.substring(0, 20) + '...');
      } else {
        console.log('❌ No publishable key in response');
      }
    } else {
      console.log('❌ get-stripe-config failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ get-stripe-config error:', error.message);
  }

  // Test 2: Test create-paid-registration with debug info
  console.log('\n2. Testing create-paid-registration edge function...');
  try {
    const testData = {
      email: 'test@example.com',
      password: 'testpassword123',
      userData: {
        first_name: 'Test',
        last_name: 'User',
        company: 'Test Company',
        company_size: '1-10'
      },
      tier: 'professional',
      billing: 'monthly'
    };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-paid-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testData)
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ create-paid-registration response:', data);
    } else {
      console.log('❌ create-paid-registration failed');
    }
  } catch (error) {
    console.log('❌ create-paid-registration error:', error.message);
  }

  // Test 3: Check Stripe Dashboard connection
  console.log('\n3. Testing Stripe Dashboard connection...');
  console.log('📋 Please check your Stripe Dashboard:');
  console.log('   - Go to: https://dashboard.stripe.com');
  console.log('   - Make sure you are in TEST mode (not LIVE mode)');
  console.log('   - Copy your TEST keys (sk_test_... and pk_test_...)');
  console.log('   - Update Supabase Environment Variables with TEST keys');
  console.log('   - Redeploy edge functions');

  console.log('\n🏁 Test completed!');
};

// Run the test
testStripeConfig().catch(console.error);
