import { loadStripe } from '@stripe/stripe-js';

// Get Stripe publishable key securely via edge function
const getStripePublishableKey = async (): Promise<string> => {
  // Always use edge function for security - no hardcoded keys
  const fallbackKey = 'pk_test_placeholder_removed_for_security';
  
  try {
    // Always get the key securely from Supabase edge function
    const response = await fetch('https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/get-stripe-config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    if (!data.publishableKey) {
      throw new Error('No publishable key returned from secure endpoint');
    }
    return data.publishableKey;
  } catch (error) {
    console.error('Failed to get secure Stripe key:', error);
    throw new Error('Unable to initialize Stripe - please check configuration');
  }
};

// Initialize Stripe with secure key loading
const initializeStripe = async () => {
  const key = await getStripePublishableKey();
  return (await import('@stripe/stripe-js')).loadStripe(key);
};

export const stripePromise = initializeStripe();

export const STRIPE_PRICING_TIERS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses',
    monthlyPrice: 25,
    yearlyPrice: 249,
    entities: 5,
    features: [
      'Up to 5 entities',
      'Basic notifications',
      'Email support',
      'Standard templates'
    ],
    popular: false
  },
  professional: {
    id: 'professional',  
    name: 'Professional',
    description: 'Most popular for growing businesses',
    monthlyPrice: 99,
    yearlyPrice: 986,
    entities: 25,
    features: [
      'Up to 25 entities',
      'Advanced notifications',
      'Priority support',
      'API access',
      'Custom reports',
      'Team collaboration'
    ],
    popular: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise', 
    description: 'For large organizations',
    monthlyPrice: 200,
    yearlyPrice: 1992,
    entities: 100,
    features: [
      'Up to 100 entities',
      'Advanced notifications',
      'Dedicated support',
      'Full API access',
      'Custom reports',
      'Team collaboration',
      'Priority processing',
      'Custom integrations'
    ],
    popular: false
  },
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited',
    description: 'Enterprise with unlimited entities',
    monthlyPrice: 350,
    yearlyPrice: 3486,
    entities: 'Unlimited',
    features: [
      'Unlimited entities',
      'Advanced notifications',
      'Dedicated account manager',
      'Full API access',
      'Custom reports',
      'Team collaboration',
      'Priority processing',
      'Custom integrations',
      'White label options'
    ],
    popular: false
  }
} as const;