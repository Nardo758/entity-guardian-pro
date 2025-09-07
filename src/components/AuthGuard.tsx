import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Building, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { user, signIn, loading } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(!user && !loading);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });

  React.useEffect(() => {
    if (!loading) {
      setIsModalOpen(!user);
    }
  }, [user, loading]);

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      toast({
        title: "Account Locked",
        description: "Too many failed login attempts. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        if (newAttempts >= 5) {
          setIsLocked(true);
          toast({
            title: "Account Locked",
            description: "Too many failed login attempts. Your account has been temporarily locked.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Login Failed",
            description: error.message + ` (${newAttempts}/5 attempts)`,
            variant: "destructive"
          });
        }
      } else {
        setIsModalOpen(false);
        setLoginAttempts(0);
        setIsLocked(false);
        toast({
          title: "Welcome!",
          description: "Successfully signed in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast({
      title: "Password Reset",
      description: "Please contact your administrator for password reset assistance.",
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show fallback if provided and user is not authenticated
  if (!user && fallback) {
    return <>{fallback}</>;
  }

  // Show children if user is authenticated
  if (user) {
    return <>{children}</>;
  }

  // Show login modal if user is not authenticated
  return (
    <>
      {/* Login Modal */}
      <Dialog open={isModalOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mb-4">
              <Building className="h-8 w-8 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl font-bold">Sign In Required</DialogTitle>
            <p className="text-muted-foreground">Please sign in to access Entity Renewal Pro</p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isLocked && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Account temporarily locked due to multiple failed login attempts.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLocked || isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLocked || isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLocked || isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => handleInputChange('rememberMe', !!checked)}
                  disabled={isLocked || isLoading}
                />
                <Label htmlFor="remember" className="text-sm">Remember me</Label>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleForgotPassword}
                disabled={isLocked || isLoading}
                className="text-sm text-primary hover:text-primary-dark"
              >
                Forgot password?
              </Button>
            </div>

            <Button 
              type="submit"
              disabled={isLocked || isLoading}
              className="w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            {loginAttempts > 0 && loginAttempts < 5 && (
              <p className="text-center text-sm text-muted-foreground">
                {5 - loginAttempts} attempts remaining
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthGuard;