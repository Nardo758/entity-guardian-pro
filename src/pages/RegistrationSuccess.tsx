import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Mail, ArrowRight, Building } from 'lucide-react';

const RegistrationSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { email, plan, signInUrl } = location.state || {};

  const handleSignIn = () => {
    // Check if signInUrl contains localhost (which won't work in production)
    if (signInUrl && !signInUrl.includes('localhost')) {
      window.location.href = signInUrl;
    } else {
      // Navigate to dashboard directly for localhost or missing signInUrl
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Welcome to Entity Renewal Pro!
          </h1>
          <p className="text-muted-foreground mt-2">
            Your account has been successfully created
          </p>
        </div>

        {/* Success Card */}
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">Registration Complete!</CardTitle>
            <CardDescription>
              Your payment was processed and your account is now active
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Account Details */}
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Account created successfully!</strong>
                  <br />
                  Your {plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : ''} plan is now active.
                </AlertDescription>
              </Alert>

              {email && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Account email:</span>
                  </div>
                  <p className="font-medium mt-1">{email}</p>
                </div>
              )}
            </div>

            {/* What's Next */}
            <div className="space-y-3">
              <h3 className="font-semibold">What's next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Access your dashboard and explore features
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Add your first business entity
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Set up renewal notifications
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Invite team members (if applicable)
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleSignIn}
                className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
                size="lg"
              >
                Access Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Need help getting started?{" "}
                  <Link 
                    to="/support" 
                    className="text-primary hover:text-primary/80 underline"
                  >
                    Contact Support
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            You'll receive a confirmation email shortly with your account details.
          </p>
          <p className="text-xs text-muted-foreground">
            Questions?{" "}
            <Link 
              to="/support" 
              className="text-primary hover:text-primary/80 underline"
            >
              We're here to help
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;