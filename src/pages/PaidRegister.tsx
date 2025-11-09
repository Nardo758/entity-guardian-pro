import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building, 
  User, 
  Mail, 
  Building2, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle,
  CreditCard,
  EyeIcon,
  EyeOffIcon,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StripeProvider } from '@/components/payment/StripeProvider';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { PlanSelector } from '@/components/payment/PlanSelector';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  companySize: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

const PaidRegister = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    companySize: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const totalSteps = 3;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      companySize: value
    }));
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.company || !formData.companySize) {
      toast.error('Please fill in all required fields');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return false;
    }
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the Terms of Service');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    
    if (currentStep === 2) {
      // Create payment intent
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('create-paid-registration', {
          body: {
            email: formData.email,
            password: formData.password,
            userData: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              company: formData.company,
              company_size: formData.companySize,
            },
            tier: selectedPlan,
            billing: selectedBilling,
          }
        });

        if (error) throw error;

        setClientSecret(data.clientSecret);
        setCurrentStep(currentStep + 1);
      } catch (error: any) {
        toast.error('Failed to initialize payment: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      // If on first step, navigate back or go home as a fallback
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('complete-paid-registration', {
        body: {
          paymentIntentId: paymentIntent.id
        }
      });

      if (error) throw error;

      toast.success('Account created successfully! Welcome to Entity Renewal Pro!');
      
      // Redirect to success page with sign-in instructions
      navigate('/registration-success', { 
        state: { 
          email: formData.email,
          plan: selectedPlan,
          signInUrl: data.signInUrl 
        } 
      });

    } catch (error: any) {
      toast.error('Failed to complete registration: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error('Payment failed: ' + error);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="John"
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Smith"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john@company.com"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company Name *</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="Your Company Inc."
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companySize">Company Size *</Label>
          <Select value={formData.companySize} onValueChange={handleSelectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select company size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10 employees</SelectItem>
              <SelectItem value="11-50">11-50 employees</SelectItem>
              <SelectItem value="51-200">51-200 employees</SelectItem>
              <SelectItem value="201-500">201-500 employees</SelectItem>
              <SelectItem value="500+">500+ employees</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Choose your plan & secure your account</h2>
        <p className="text-muted-foreground">Select a plan and create your password</p>
      </div>

      <PlanSelector
        selectedPlan={selectedPlan}
        selectedBilling={selectedBilling}
        onPlanChange={setSelectedPlan}
        onBillingChange={setSelectedBilling}
      />

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Secure Your Account</h3>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Create a strong password"
              className="pl-10 pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <EyeIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              className="pl-10 pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <EyeIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <input
            id="agreeToTerms"
            name="agreeToTerms"
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={handleInputChange}
            className="h-4 w-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary"
            required
          />
          <Label htmlFor="agreeToTerms" className="text-sm text-muted-foreground leading-relaxed">
            I agree to the{" "}
            <Link to="/terms" className="text-primary hover:text-primary/80 underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:text-primary/80 underline">
              Privacy Policy
            </Link>
          </Label>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Complete Your Payment</h2>
        <p className="text-muted-foreground">Secure payment to activate your account</p>
      </div>

      {clientSecret && (
        <>
          {console.log('PaidRegister: Rendering with clientSecret:', clientSecret)}
          <StripeProvider clientSecret={clientSecret}>
            <PaymentForm
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              loading={isLoading}
            />
          </StripeProvider>
        </>
      )}

      {!clientSecret && (
        <Alert>
          <AlertDescription>
            Initializing secure payment form...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity cursor-pointer">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Building className="h-8 w-8 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Join Entity Renewal Pro
          </h1>
          <p className="text-muted-foreground mt-2">
            Get started with professional entity management
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        {/* Form */}
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {currentStep === 1 && <User className="w-5 h-5" />}
              {currentStep === 2 && <Building className="w-5 h-5" />}
              {currentStep === 3 && <CreditCard className="w-5 h-5" />}
              {currentStep === 1 && "Account Information"}
              {currentStep === 2 && "Plan & Security"}
              {currentStep === 3 && "Payment"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about yourself and your business"}
              {currentStep === 2 && "Choose your plan and secure your account"}
              {currentStep === 3 && "Complete payment to activate your account"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep < 3 && (
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-primary to-primary-dark"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {currentStep === 2 ? 'Preparing Payment...' : 'Processing...'}
                    </div>
                  ) : (
                    <>
                      {currentStep === 2 ? 'Proceed to Payment' : 'Continue'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link 
              to="/login" 
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaidRegister;