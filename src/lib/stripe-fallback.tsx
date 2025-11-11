import React from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Fallback Stripe key for development
const FALLBACK_STRIPE_KEY = 'pk_test_51234567890abcdef';

// Simple fallback initialization
export const stripePromiseFallback = loadStripe(FALLBACK_STRIPE_KEY);

// Mock payment form component
export const MockPaymentForm: React.FC = () => {
  return (
    <div className="space-y-4 p-6 border rounded-lg bg-muted/50">
      <h3 className="font-semibold">Development Payment Form</h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Card Number</label>
          <input 
            type="text" 
            placeholder="4242 4242 4242 4242" 
            className="w-full p-3 border rounded-md"
            disabled
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Expiry</label>
            <input 
              type="text" 
              placeholder="12/34" 
              className="w-full p-3 border rounded-md"
              disabled
            />
          </div>
          <div>
            <label className="text-sm font-medium">CVC</label>
            <input 
              type="text" 
              placeholder="123" 
              className="w-full p-3 border rounded-md"
              disabled
            />
          </div>
        </div>
      </div>
      <button 
        className="w-full bg-primary text-primary-foreground p-3 rounded-md font-medium"
        onClick={() => {
          // Simulate successful payment
          const mockPaymentIntent = { id: 'pi_mock_success' };
          window.dispatchEvent(new CustomEvent('mockPaymentSuccess', { detail: mockPaymentIntent }));
        }}
      >
        Complete Payment (Development Mode)
      </button>
      <p className="text-xs text-muted-foreground text-center">
        This is a mock payment form for development
      </p>
    </div>
  );
};
