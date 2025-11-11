// Mock payment function for development/testing
// This function simulates the edge function behavior when Stripe is not configured

export const mockCreatePaymentIntent = async (formData: any) => {
  console.log('Using mock payment function for development');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock client secret
  return {
    clientSecret: 'pi_mock_client_secret_for_development',
    customerId: 'cus_mock_customer_id',
    paymentIntentId: 'pi_mock_payment_intent_id'
  };
};

export const mockCompleteRegistration = async (paymentIntentId: string) => {
  console.log('Using mock completion function for development');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock success response
  return {
    success: true,
    userId: 'mock_user_id',
    email: 'test@example.com',
    subscriptionTier: 'starter',
    signInUrl: '/login'
  };
};
