import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';

interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret?: string;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ 
  children, 
  clientSecret 
}) => {
  console.log('StripeProvider: clientSecret received:', clientSecret);
  
  const options = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: 'hsl(var(--primary))',
        colorBackground: 'hsl(var(--background))',
        colorText: 'hsl(var(--foreground))',
        colorDanger: 'hsl(var(--destructive))',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
      rules: {
        '.Input': {
          backgroundColor: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          padding: '12px',
        },
        '.Input:focus': {
          border: '2px solid hsl(var(--primary))',
          boxShadow: '0 0 0 1px hsl(var(--primary))',
        },
        '.Label': {
          color: 'hsl(var(--foreground))',
          fontSize: '14px',
          fontWeight: '500',
        },
      },
    },
  } : undefined;

  console.log('StripeProvider: options configured:', options);

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};