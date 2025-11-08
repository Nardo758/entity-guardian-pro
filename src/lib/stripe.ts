import { loadStripe } from '@stripe/stripe-js';

// Lazy-loaded and cacheable Stripe loader. Resolves to null on failure.
let cachedStripePromise: Promise<import('@stripe/stripe-js').Stripe | null> | null = null;

async function createStripePromise() {
  try {
    const response = await fetch('https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/get-stripe-config', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error('Failed to fetch Stripe config:', response.status);
      return null;
    }

    const data = await response.json();
    if (!data.publishableKey) {
      console.error('No publishable key returned from server');
      return null;
    }

    return loadStripe(data.publishableKey);
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return null;
  }
}

export function getFreshStripePromise() {
  // Always create a new promise (useful after config changes)
  return createStripePromise();
}

export function getStripePromise() {
  // Cache between renders to avoid multiple loads
  if (!cachedStripePromise) cachedStripePromise = createStripePromise();
  return cachedStripePromise;
}

// Backwards compatibility export (may resolve to null)
export const stripePromise = getStripePromise();

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