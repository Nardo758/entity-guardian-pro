import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAgents } from '@/hooks/useAgents';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building, MapPin, FileText, Eye, EyeOff } from 'lucide-react';
import PasswordStrengthIndicator from '@/components/ui/PasswordStrengthIndicator';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const agentSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  confirmPassword: z.string(),
  states: z.array(z.string()).min(1, 'Select at least one state'),
  years_experience: z.number().min(0, 'Years of experience must be 0 or greater').max(50, 'Maximum 50 years').optional(),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AgentFormData = z.infer<typeof agentSchema>;

const AgentSignup = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { createAgentProfile } = useAgents();
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      company_name: '',
      contact_email: '',
      password: '',
      confirmPassword: '',
      states: [],
      years_experience: 0,
      bio: '',
    },
  });

  const handleStateToggle = (state: string) => {
    const newStates = selectedStates.includes(state)
      ? selectedStates.filter(s => s !== state)
      : [...selectedStates, state];
    
    setSelectedStates(newStates);
    form.setValue('states', newStates);
  };

  const onSubmit = async (data: AgentFormData) => {
    setIsSubmitting(true);
    try {
      // Step 1: Create user account with Supabase Auth
      const { error: signUpError } = await signUp(
        data.contact_email, 
        data.password,
        {
          first_name: data.company_name.split(' ')[0] || '',
          last_name: data.company_name.split(' ').slice(1).join(' ') || '',
          user_type: 'agent'
        }
      );

      if (signUpError) {
        if (signUpError.message?.includes('already registered')) {
          toast.error('An account with this email already exists. Please use a different email or sign in instead.');
        } else if (signUpError.message?.includes('confirmation email') || signUpError.message?.includes('email')) {
          // Handle email sending issues gracefully
          toast.error('Account created but email confirmation failed. You can still proceed to sign in.');
          // Continue with the flow anyway
        } else {
          toast.error(`Account creation failed: ${signUpError.message}`);
        }
        
        // Only return early if it's not an email-related error
        if (!signUpError.message?.includes('confirmation email') && !signUpError.message?.includes('Error sending confirmation email')) {
          return;
        }
      }

      // Step 2: For development - skip email confirmation check
      // First try to sign in (in case email confirmation is disabled)
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.contact_email,
        password: data.password,
      });

      if (signInError) {
        if (signInError.message?.includes('Email not confirmed')) {
          toast.success(`Account created successfully! 
          
EMAIL CONFIRMATION REQUIRED: Please check your email and click the confirmation link. 
If you don't receive an email, please contact support.

Note: Currently only emails to m.dixon5030@gmail.com will be delivered due to email service configuration.`);
          return;
        } else {
          console.error('Sign in error:', signInError);
          toast.error(`Authentication failed: ${signInError.message}`);
          return;
        }
      }

      if (!authData.user) {
        toast.error('Failed to authenticate after account creation');
        return;
      }

      // Step 3: Create agent profile (without pricing - to be set later in dashboard)
      // Note: Role is automatically assigned by database trigger based on user_type metadata
      await createAgentProfile({
        company_name: data.company_name,
        contact_email: data.contact_email,
        states: selectedStates,
        price_per_entity: 0, // Default to 0, will be set in dashboard settings
        years_experience: data.years_experience,
        bio: data.bio,
        is_available: true,
      });
      
      toast.success('Agent profile created successfully! Welcome to the platform.');
      navigate('/agent-dashboard');
    } catch (error: any) {
      console.error('Agent signup error:', error);
      toast.error(error.message || 'Failed to create agent profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Become a Registered Agent</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Join our network of professional registered agents and connect with businesses 
          that need your services. Set your rates, choose your states, and grow your practice.
        </p>
        <p className="text-sm text-muted-foreground mt-3">
          Are you a Business Owner looking to manage entities? <Link to="/register" className="text-primary hover:underline font-medium">Sign up as Entity Owner instead</Link>
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Benefits Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why Join Our Network?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Direct Client Connections</p>
                  <p className="text-xs text-muted-foreground">Get matched with businesses in your service areas</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Dashboard Management</p>
                  <p className="text-xs text-muted-foreground">Set pricing and manage clients from your dashboard</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Multi-State Coverage</p>
                  <p className="text-xs text-muted-foreground">Serve clients across all your licensed states</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Professional Profile</p>
                  <p className="text-xs text-muted-foreground">Showcase your experience and expertise</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Agent Profile Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Company or Professional Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be your account login email and how clients contact you
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Create Password *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="At least 8 characters"
                              minLength={8}
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <PasswordStrengthIndicator password={field.value} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="Re-enter your password"
                              minLength={8}
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="years_experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="5"
                            min="0"
                            max="50"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                              field.onChange(isNaN(value) ? 0 : Math.max(0, Math.min(50, value)));
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          How many years have you been providing registered agent services?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="states"
                    render={() => (
                      <FormItem>
                        <FormLabel>Licensed States *</FormLabel>
                        <FormDescription>
                          Select all states where you're licensed to serve as a registered agent
                        </FormDescription>
                        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                          {US_STATES.map(state => (
                            <div key={state} className="flex items-center space-x-2">
                              <Checkbox
                                id={state}
                                checked={selectedStates.includes(state)}
                                onCheckedChange={() => handleStateToggle(state)}
                              />
                              <Label
                                htmlFor={state}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {state}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {selectedStates.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedStates.map(state => (
                              <Badge
                                key={state}
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={() => handleStateToggle(state)}
                              >
                                {state} ×
                              </Badge>
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell potential clients about your experience, specializations, and what sets you apart..."
                            className="min-h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: Describe your expertise and services (max 500 characters). You can set your pricing later in the dashboard.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating Account & Profile...' : 'Create Agent Profile'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentSignup;