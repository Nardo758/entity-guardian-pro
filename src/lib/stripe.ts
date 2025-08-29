import { loadStripe } from '@stripe/stripe-js';

// Using the live Stripe publishable key
export const stripePromise = loadStripe(
  'pk_live_51S0ulgCnuIeihlVEvkKFnrDPDbVGYvl16OsN9CWTmFbmEz3jB64Hd9WuCk7JNuWoBICO5nQkcEqlo5GYEPnizLhc00M8VnktP8'
);

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