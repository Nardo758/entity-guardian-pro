// Stripe Diagnostic Script
// Run with: node diagnose-stripe.js

const SUPABASE_URL = 'https://wcuxqopfcgivypbiynjp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdXhxb3BmY2dpdnlwYml5bmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNDI1NzMsImV4cCI6MjA3MTkxODU3M30.-RkbzPY_FZVd9qShJxi959LLSqWXYI7Mkqk1DqJVt6o';

console.log('🔍 Diagnosing Stripe Configuration...\n');

async function checkStripeConfig() {
  console.log('1️⃣ Checking Stripe publishable key configuration...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-stripe-config`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok && data.publishableKey) {
      console.log('✅ Publishable key configured');
      console.log(`   Key: ${data.publishableKey.substring(0, 20)}...`);
    } else {
      console.log('❌ Publishable key NOT configured');
      console.log('   Error:', data);
    }
  } catch (error) {
    console.log('❌ Failed to check config:', error.message);
  }
  
  console.log('');
}

async function testSyncPricing() {
  console.log('2️⃣ Testing sync-pricing function...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-pricing`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Sync-pricing SUCCESS!');
      console.log('\n📦 Products created:');
      if (data.results) {
        Object.keys(data.results).forEach(tier => {
          console.log(`   • ${tier.toUpperCase()}`);
          console.log(`     Product: ${data.results[tier].productId}`);
          console.log(`     Monthly: ${data.results[tier].monthlyPriceId}`);
          console.log(`     Yearly:  ${data.results[tier].yearlyPriceId}`);
        });
      }
    } else {
      console.log('❌ Sync-pricing FAILED');
      console.log('\n🔍 Error details:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.error && data.error.includes('API')) {
        console.log('\n💡 Possible causes:');
        console.log('   1. STRIPE_SECRET_KEY not set in Supabase secrets');
        console.log('   2. Invalid Stripe secret key');
        console.log('   3. Using restricted key without proper permissions');
        console.log('\n🔧 Solution:');
        console.log('   Go to: https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/settings/secrets');
        console.log('   Verify: STRIPE_SECRET_KEY=sk_live_...');
      }
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
  
  console.log('');
}

async function checkSupabaseSecrets() {
  console.log('3️⃣ Required Supabase Secrets:');
  console.log('   • STRIPE_SECRET_KEY (backend)');
  console.log('   • STRIPE_PUBLISHABLE_KEY (backend)');
  console.log('   • STRIPE_WEBHOOK_SECRET (for webhooks)');
  console.log('\n   Check at: https://supabase.com/dashboard/project/wcuxqopfcgivypbiynjp/settings/secrets');
  console.log('');
}

// Run all diagnostics
(async () => {
  await checkStripeConfig();
  await testSyncPricing();
  await checkSupabaseSecrets();
  
  console.log('✅ Diagnostic complete!');
  console.log('\nIf sync-pricing failed, check the error details above.');
})();
