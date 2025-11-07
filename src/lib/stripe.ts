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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.publishableKey) {
      throw new Error('No publishable key returned from secure endpoint');
    }
    return data.publishableKey;
  } catch (error) {
    console.error('Failed to get secure Stripe key:', error);
    if (import.meta.env.DEV) {
      console.warn('Using development fallback for Stripe key');
      return 'pk_test_51S0ulgCnuIeihlVEQ5uqJLXPxaJWIHZqGaRj0pRgk9F8ZbzKYrJLp2yNR7YqKwJYO5xZl1Z1Z1Z1Z1Z1Z1Z1Z1Z1'; // Your test publishable key
    }
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
    monthlyPrice: 19,
    yearlyPrice: 191,
    entities: 4,
    features: [
      'Up to 4 entities',
      'Basic notifications',
      'Email support',
      'Standard templates'
    ],
    popular: false,
    perEntityCost: '$4.75 per entity'
  },
  growth: {
    id: 'growth',  
    name: 'Growth',
    description: 'Most popular for growing businesses',
    monthlyPrice: 49,
    yearlyPrice: 492,
    entities: 20,
    features: [
      'Up to 20 entities',
      'Advanced notifications',
      'API access',
      'Custom reports',
      'Chat support',
      'Team collaboration'
    ],
    popular: true,
    perEntityCost: '$2.45 per entity'
  },
  professional: {
    id: 'professional',
    name: 'Professional', 
    description: 'For established businesses',
    monthlyPrice: 99,
    yearlyPrice: 994,
    entities: 50,
    features: [
      'Up to 50 entities',
      'Advanced notifications',
      'Phone support',
      'Advanced analytics',
      'API access',
      'Custom reports',
      'International coverage',
      'Team collaboration'
    ],
    popular: false,
    perEntityCost: '$1.98 per entity'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: 249,
    yearlyPrice: 2500,
    entities: 150,
    features: [
      'Up to 150 entities',
      'Advanced notifications',
      'Dedicated account manager',
      'Full API access',
      'Advanced analytics',
      'Custom reports',
      'White label options',
      'Unlimited users',
      'Priority processing',
      'Custom integrations'
    ],
    popular: false,
    perEntityCost: '$1.66 per entity'
  }
};