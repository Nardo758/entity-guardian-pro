// Test script for email confirmation function
// Run this with: node test-email-function.js

const testEmailFunction = async () => {
  const SUPABASE_URL = "https://wcuxqopfcgivypbiynjp.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdXhxb3BmY2dpdnlwYml5bmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNDI1NzMsImV4cCI6MjA3MTkxODU3M30.-RkbzPY_FZVd9qShJxi959LLSqWXYI7Mkqk1DqJVt6o";

  const testPayload = {
    user: {
      id: "test-user-id",
      email: "test@example.com",
      raw_user_meta_data: {
        first_name: "Test",
        last_name: "User"
      }
    },
    email_data: {
      token: "test-token-123",
      token_hash: "test-token-hash",
      redirect_to: "https://wcuxqopfcgivypbiynjp.supabase.co/auth/v1/verify",
      email_action_type: "signup",
      site_url: "https://wcuxqopfcgivypbiynjp.supabase.co"
    }
  };

  try {
    console.log("Testing email function...");
    console.log("Payload:", JSON.stringify(testPayload, null, 2));

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-auth-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    
    console.log("Response status:", response.status);
    console.log("Response body:", result);

    if (response.ok) {
      console.log("✅ Email function test successful!");
    } else {
      console.log("❌ Email function test failed!");
    }
  } catch (error) {
    console.error("❌ Error testing email function:", error);
  }
};

// Run the test
testEmailFunction();
