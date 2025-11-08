import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe promise that will load the key and Stripe.js
export const stripePromise = (async () => {
  try {
    // Get the key securely from Supabase edge function
    const response = await fetch('https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/get-stripe-config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to fetch Stripe config:', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.publishableKey) {
      throw new Error('No publishable key returned from server');
    }
    
    console.log('Stripe key loaded successfully');
    return loadStripe(data.publishableKey);
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    throw new Error('Unable to initialize Stripe - please check your connection and try again');
  }
})();

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