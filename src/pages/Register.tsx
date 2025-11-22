import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Building, Mail, User, Building2, ShieldAlert, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentIP, setCurrentIP] = useState<string>('');
  const [resettingIP, setResettingIP] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    companySize: "",
  });

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchIP = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-client-ip');
        if (!error && data?.ip) {
          setCurrentIP(data.ip);
        }
      } catch (err) {
        console.error('Failed to fetch IP:', err);
      }
    };
    fetchIP();
  }, []);

  const handleResetIPBlock = async () => {
    setResettingIP(true);
    try {
      const { error } = await supabase.functions.invoke('reset-ip-reputation', {
        body: { ipAddress: currentIP }
      });

      if (error) throw error;

      toast({
        title: "IP Block Reset",
        description: "You can now try registering again.",
      });
      setIsRateLimited(false);
    } catch (err: any) {
      toast({
        title: "Failed to reset IP block",
        description: err.message || "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setResettingIP(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.company || !formData.companySize) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    // Navigate to Step 3 (PaidRegister) with form data
    toast({
      title: "Information Saved!",
      description: "Now let's choose your plan and create your password.",
    });
    
    navigate("/paid-register", { 
      state: { 
        formData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          company: formData.company,
          companySize: formData.companySize,
        }
      } 
    });
  };

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

  const currentStep = 2;
  const totalSteps = 3;
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity cursor-pointer">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Building className="h-8 w-8 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Account Information
          </h1>
          <p className="text-muted-foreground mt-2">
            Create your <strong>Entity Owner</strong> account and start managing your business entities
          </p>
          <p className="text-sm text-muted-foreground">
            Are you a Registered Agent? <Link to="/agent-signup" className="text-primary hover:underline font-medium">Sign up here instead</Link>
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Registration Form */}
        <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Fill in your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isRateLimited && currentIP && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Registration temporarily blocked</p>
                    <p className="text-sm mt-1">Your IP: {currentIP}</p>
                  </div>
                  <Button
                    onClick={handleResetIPBlock}
                    disabled={resettingIP}
                    variant="outline"
                    size="sm"
                    className="ml-4"
                  >
                    {resettingIP ? 'Resetting...' : 'Reset IP Block (Dev)'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Smith"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
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

              {/* Company Fields */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">
                  Company Name
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Your Company Inc."
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize" className="text-sm font-medium">
                  Company Size
                </Label>
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

              {/* Navigation Buttons */}
              <div className="flex gap-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/signup')}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </form>

            {/* Sign In Link */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link 
                  to="/login" 
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Sign In
                </Link>
              </p>
              <p className="text-xs text-muted-foreground">
                Signing up as a <strong>Registered Agent</strong>?{" "}
                <Link 
                  to="/agent-signup" 
                  className="text-primary hover:underline"
                >
                  Click here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;