// Test file for complete-paid-registration function
// This file contains test examples and utilities for testing the function

interface TestPaymentRequest {
  paymentIntentId: string;
}

interface TestStripeMetadata {
  email: string;
  registration: string;
  first_name: string;
  last_name: string;
  company?: string;
  company_size?: string;
  tier: string;
  billing: 'monthly' | 'yearly';
}

// Test data examples
const validTestData: TestPaymentRequest = {
  paymentIntentId: "pi_3K1234567890abcdef01234567"
};

const validMetadata: TestStripeMetadata = {
  email: "test@example.com",
  registration: "reg_123456789",
  first_name: "John",
  last_name: "Doe",
  company: "Test Company",
  company_size: "10-50",
  tier: "pro",
  billing: "monthly"
};

// Test cases for validation
const invalidTestCases = [
  {
    name: "Missing payment intent ID",
    data: {},
    expectedError: "VALIDATION_ERROR"
  },
  {
    name: "Invalid payment intent ID format",
    data: { paymentIntentId: "invalid_id" },
    expectedError: "VALIDATION_ERROR"
  },
  {
    name: "Empty payment intent ID",
    data: { paymentIntentId: "" },
    expectedError: "VALIDATION_ERROR"
  },
  {
    name: "Non-string payment intent ID",
    data: { paymentIntentId: 123456 },
    expectedError: "VALIDATION_ERROR"
  }
];

// Test metadata validation cases
const invalidMetadataCases = [
  {
    name: "Invalid email",
    metadata: { ...validMetadata, email: "invalid-email" },
    expectedError: "Invalid email address"
  },
  {
    name: "Missing first name",
    metadata: { ...validMetadata, first_name: "" },
    expectedError: "First name is required"
  },
  {
    name: "Missing last name",
    metadata: { ...validMetadata, last_name: "" },
    expectedError: "Last name is required"
  },
  {
    name: "Invalid tier",
    metadata: { ...validMetadata, tier: "invalid" },
    expectedError: "Invalid subscription tier"
  },
  {
    name: "Invalid billing",
    metadata: { ...validMetadata, billing: "invalid" as any },
    expectedError: "Invalid billing period"
  }
];

// Mock Stripe payment intent responses
const mockSuccessfulPaymentIntent = {
  id: "pi_3K1234567890abcdef01234567",
  status: "succeeded",
  amount: 2999,
  customer: "cus_1234567890abcdef",
  metadata: validMetadata
};

const mockFailedPaymentIntent = {
  id: "pi_3K1234567890abcdef01234567",
  status: "requires_payment_method",
  amount: 2999,
  customer: "cus_1234567890abcdef",
  metadata: validMetadata
};

// Test helper functions
async function testFunction(url: string, data: any) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    return {
      status: response.status,
      data: result,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message
    };
  }
}

// Rate limiting test
async function testRateLimit(url: string) {
  const promises = [];
  const data = validTestData;

  // Send 10 requests simultaneously
  for (let i = 0; i < 10; i++) {
    promises.push(testFunction(url, data));
  }

  const results = await Promise.all(promises);
  
  // Check if some requests were rate limited
  const rateLimited = results.filter(r => r.status === 429);
  const successful = results.filter(r => r.status !== 429);

  console.log(`Rate limit test: ${successful.length} successful, ${rateLimited.length} rate limited`);
  
  return {
    successful: successful.length,
    rateLimited: rateLimited.length,
    results
  };
}

// Example test runner
async function runTests() {
  const functionUrl = 'http://localhost:54321/functions/v1/complete-paid-registration';
  
  console.log('🧪 Running validation tests...');
  
  // Test invalid requests
  for (const testCase of invalidTestCases) {
    console.log(`Testing: ${testCase.name}`);
    const result = await testFunction(functionUrl, testCase.data);
    
    if (result.status === 400 && result.data?.code === testCase.expectedError) {
      console.log('✅ PASS');
    } else {
      console.log('❌ FAIL', result);
    }
  }

  console.log('\n🧪 Running rate limit tests...');
  await testRateLimit(functionUrl);

  console.log('\n🧪 Running CORS tests...');
  // Test CORS preflight
  const corsResult = await fetch(functionUrl, { method: 'OPTIONS' });
  console.log('CORS headers:', Object.fromEntries(corsResult.headers.entries()));
}

// Export for use in other test files
export {
  validTestData,
  validMetadata,
  invalidTestCases,
  invalidMetadataCases,
  mockSuccessfulPaymentIntent,
  mockFailedPaymentIntent,
  testFunction,
  testRateLimit,
  runTests
};

// Example usage:
// To run tests locally:
// 1. Start Supabase local development: supabase start
// 2. Deploy the function: supabase functions deploy complete-paid-registration
// 3. Run: deno run --allow-net test.ts