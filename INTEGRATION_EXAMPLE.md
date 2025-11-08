# 🔌 Quick Integration Example

## How to Integrate New UX Components

### Step 1: Wrap App with CheckoutProvider

**File**: `src/App.tsx` or `src/main.tsx`

```tsx
import { CheckoutProvider } from '@/contexts/CheckoutContext';

function App() {
  return (
    <CheckoutProvider>
      {/* Your existing app structure */}
      <BrowserRouter>
        <Routes>
          <Route path="/billing" element={<Billing />} />
          {/* other routes */}
        </Routes>
      </BrowserRouter>
    </CheckoutProvider>
  );
}
```

---

### Step 2: Update Billing Page

**File**: `src/pages/Billing.tsx` (example integration)

```tsx
import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useCheckout } from '@/contexts/CheckoutContext';
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { Button } from '@/components/ui/button';

export function Billing() {
  const { subscription, loading, error, createCheckout } = useSubscription();
  const { currentStep, isProcessing, selectPlan } = useCheckout();

  const handleUpgrade = async (tier: string, billing: 'monthly' | 'yearly') => {
    // Update checkout context
    selectPlan(tier, billing);
    
    // Create checkout session (now with single consistent flow)
    await createCheckout(tier, billing);
  };

  if (loading) {
    return (
      <div className="container py-8">
        <LoadingSkeleton variant="plan" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <ErrorDisplay 
          error={error} 
          onRetry={() => window.location.reload()}
          showSupport={true}
        />
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <ProgressSteps 
          currentStep={currentStep === 'select' ? 1 : 2}
          isProcessing={isProcessing}
        />
      </div>

      {/* Current Subscription */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Current Plan</h2>
        <div className="p-4 border rounded-lg">
          <p>Tier: {subscription.tier}</p>
          <p>Status: {subscription.subscribed ? 'Active' : 'Inactive'}</p>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.tier} className="border rounded-lg p-6">
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="text-3xl font-bold my-4">${plan.price}/mo</p>
            <Button
              onClick={() => handleUpgrade(plan.tier, 'monthly')}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : 'Upgrade'}
            </Button>
          </div>
        ))}
      </div>

      {/* Loading Overlay during checkout */}
      {isProcessing && (
        <LoadingSkeleton 
          variant="overlay" 
          message="Creating your checkout session..." 
        />
      )}
    </div>
  );
}

const plans = [
  { tier: 'starter', name: 'Starter', price: 19 },
  { tier: 'growth', name: 'Growth', price: 49 },
  { tier: 'professional', name: 'Professional', price: 99 }
];
```

---

### Step 3: Update CheckoutModal (if you have one)

**File**: `src/components/payment/CheckoutModal.tsx`

```tsx
import { useCheckout } from '@/contexts/CheckoutContext';
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { currentStep, isInitializing, isProcessing, error, reset } = useCheckout();

  if (isInitializing) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <LoadingSkeleton variant="checkout" message="Initializing payment..." />
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <ErrorDisplay 
            error={error}
            onRetry={reset}
            showSupport={true}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-6">
          <ProgressSteps 
            currentStep={currentStep === 'select' ? 1 : currentStep === 'payment' ? 2 : 3}
            isProcessing={isProcessing}
          />
        </div>

        {/* Modal content based on current step */}
        {currentStep === 'select' && <PlanSelection />}
        {currentStep === 'payment' && <PaymentForm />}
        {currentStep === 'confirm' && <ConfirmationScreen />}
      </DialogContent>
    </Dialog>
  );
}
```

---

### Step 4: Testing Integration

#### Test 1: Normal Checkout Flow
```bash
# Start dev server
npm run dev

# Navigate to billing page
# Click "Upgrade" button
# Verify:
# - Progress indicator shows "Select Plan" as complete
# - Progress indicator shows "Payment" as current with spinner
# - Toast shows "Creating checkout session..."
# - Stripe modal opens (no external redirect)
```

#### Test 2: Error Handling
```bash
# Disconnect internet
# Click "Upgrade" button
# Verify:
# - Error display appears with specific message
# - "Try Again" button present
# - "Contact Support" button present
# - Click "Try Again" → retries operation
```

#### Test 3: Loading States
```bash
# Navigate to billing page
# Watch for loading skeleton while subscription loads
# Click "Upgrade"
# Verify overlay loader shows "Creating your checkout session..."
# No flickering between states
```

#### Test 4: Accessibility
```bash
# Use Tab key to navigate
# Verify focus indicators on buttons
# Use screen reader (NVDA/JAWS)
# Verify ARIA labels read correctly
# Progress steps announce as "Select Plan - Complete"
```

---

## 🎯 Key Benefits

### Before Integration
- ❌ Unpredictable checkout flow (sometimes modal, sometimes redirect)
- ❌ No progress indication → user anxiety
- ❌ Generic loading spinners → confusing
- ❌ Generic errors → no guidance
- ❌ Multiple uncoordinated loading states → flickering

### After Integration
- ✅ Consistent checkout flow → always modal
- ✅ Clear progress indication → reduces anxiety
- ✅ Context-appropriate loading states → professional
- ✅ Actionable error messages → higher recovery rate
- ✅ Centralized state management → smooth UX

---

## 📊 Metrics to Track

Monitor these KPIs after integration:

1. **Checkout Completion Rate**
   - Before: X%
   - Target: +15% improvement

2. **Error Recovery Rate**
   - Users who click "Try Again" and succeed
   - Target: 60%+

3. **Time to Checkout**
   - Average time from "Upgrade" click to payment
   - Target: < 30 seconds

4. **Support Tickets**
   - Payment-related support requests
   - Target: -30% reduction

5. **User Feedback**
   - NPS/CSAT scores for checkout experience
   - Target: 8+/10

---

## 🔧 Customization Options

### Change Progress Steps Text
```tsx
<ProgressSteps 
  currentStep={2}
  steps={['Choose', 'Pay', 'Done']}  // Custom labels
/>
```

### Customize Loading Messages
```tsx
<LoadingSkeleton 
  variant="overlay"
  message="Processing your payment securely..."  // Custom message
/>
```

### Customize Error Support Email
```tsx
// In ErrorDisplay.tsx line 92
onClick={() => window.location.href = 'mailto:your-support@domain.com'}
```

### Change Step Count
```tsx
// For 4-step checkout
<ProgressSteps 
  currentStep={currentStep}
  steps={['Select', 'Details', 'Payment', 'Confirm']}
/>
```

---

## 🐛 Troubleshooting

### Issue: Progress indicator not updating
**Solution**: Ensure CheckoutProvider wraps your component tree at the correct level

### Issue: Loading skeleton flickers
**Solution**: Check that you're using centralized loading states from CheckoutContext, not local state

### Issue: Error display not showing
**Solution**: Verify error is being passed correctly and is either Error object or string

### Issue: Stripe modal not opening
**Solution**: 
1. Check browser console for Stripe initialization errors
2. Verify Stripe publishable key is set in environment variables
3. Test with network tab open to see API requests

---

## 📝 Next Steps

After integrating these components:

1. ✅ Test thoroughly (use checklist in UX_IMPROVEMENTS_IMPLEMENTED.md)
2. ✅ Monitor metrics for 1-2 weeks
3. ✅ Gather user feedback
4. ✅ Implement remaining 10 UX issues (see UX_IMPROVEMENTS_IMPLEMENTED.md)
5. ✅ Consider A/B testing different progress messages
6. ✅ Add analytics tracking to checkout steps

---

**Need Help?** Check the comprehensive guide in `UX_IMPROVEMENTS_IMPLEMENTED.md`
