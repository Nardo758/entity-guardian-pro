import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, ArrowRight, Home, Receipt } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const paymentIntent = searchParams.get('payment_intent');
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
  const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    // Simulate loading check
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

      const handleGoToDashboard = () => {
        navigate('/dashboard');
      };

  const handleViewBilling = () => {
    navigate('/billing');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Payment Successful!
          </h1>
          <p className="text-muted-foreground mt-2">
            Thank you for your payment
          </p>
        </div>

        {/* Success Card */}
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">Payment Complete</CardTitle>
            <CardDescription>
              Your payment has been processed successfully
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Payment Details */}
            {redirectStatus === 'succeeded' && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Payment confirmed!</strong>
                  <br />
                  Your subscription is now active and ready to use.
                </AlertDescription>
              </Alert>
            )}

            {paymentIntent && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Payment ID:</span>
                </div>
                <p className="font-mono text-sm mt-1">{paymentIntent}</p>
              </div>
            )}

            {/* What's Next */}
            <div className="space-y-3">
              <h3 className="font-semibold">What happens now?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Your subscription is now active
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  You'll receive an email confirmation
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Full access to all plan features
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Manage subscription in billing settings
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleGoToDashboard}
                className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>

              <Button
                variant="outline"
                onClick={handleViewBilling}
                className="w-full"
              >
                <Receipt className="w-4 h-4 mr-2" />
                View Billing Details
              </Button>
            </div>

            {/* Support Link */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Have questions about your payment?{" "}
                <Link 
                  to="/support" 
                  className="text-primary hover:text-primary/80 underline"
                >
                  Contact Support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;