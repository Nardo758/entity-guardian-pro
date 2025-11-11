import { loadStripe } from '@stripe/stripe-js';

// Get Stripe publishable key securely via edge function
const getStripePublishableKey = async (): Promise<string> => {
  try {
    const response = await fetch('https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/get-stripe-config', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Stripe config');
    }

    const data = await response.json();
    if (!data.publishableKey) {
      throw new Error('No publishable key returned from secure endpoint');
    }

    return data.publishableKey as string;
  } catch (error) {
    console.error('Failed to get secure Stripe key:', error);
    throw error;
  }
};

// Initialize Stripe with secure key loading
const initializeStripe = async () => {
  const key = await getStripePublishableKey();
  return loadStripe(key);
};

export const stripePromise = initializeStripe();

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
    // Provided mapping uses the same link for both periods
    monthly: 'https://buy.stripe.com/00weVc32N2am2PLajc2go05',
    yearly: 'https://buy.stripe.com/00weVc32N2am2PLajc2go05',
  },
};

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