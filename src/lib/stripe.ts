import { loadStripe } from '@stripe/stripe-js';

// Get Stripe publishable key securely via edge function
const getStripePublishableKey = async (): Promise<string> => {
  // Fallback key for development/testing
  const fallbackKey = 'pk_test_51234567890abcdef';
  
  try {
    // Get the key securely from Supabase edge function
    const response = await fetch('https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/get-stripe-config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn('Failed to fetch Stripe config from edge function, using fallback');
      return fallbackKey;
    }
    
    const data = await response.json();
    if (!data.publishableKey) {
      console.warn('No publishable key returned from secure endpoint, using fallback');
      return fallbackKey;
    }
    return data.publishableKey;
  } catch (error) {
    console.error('Failed to get secure Stripe key:', error);
    console.warn('Using fallback Stripe key for development');
    return fallbackKey;
  }
};

// Direct Stripe Checkout links by plan and billing period
export const STRIPE_CHECKOUT_LINKS: Record<string, { monthly?: string; yearly?: string }> = {
  starter: {
    monthly: 'https://buy.stripe.com/fZu8wO0UF2am8a59f82go01',
    yearly: 'https://buy.stripe.com/eVq8wO0UFeX8eyt3UO2go02',
  },
  professional: {
    monthly: 'https://buy.stripe.com/4gM7sK1YJ16i3TP8b42go03',
    yearly: 'https://buy.stripe.com/4gMcN40UFcP0bmh0IC2go04',
  },
  enterprise: {
    monthly: 'https://buy.stripe.com/00weVc32N2am2PLajc2go05',
    yearly: 'https://buy.stripe.com/3cI4gyeLv8yKbmh8b42go06',
  },
  growth: {
    // Note: Both monthly and yearly currently point to the same URL as provided.
    monthly: 'https://buy.stripe.com/00weVc32N2am2PLajc2go05',
    yearly: 'https://buy.stripe.com/00weVc32N2am2PLajc2go05',
  },
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