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
import { toast } from 'sonner';
import { Building, MapPin, DollarSign, FileText } from 'lucide-react';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const agentSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  company_name: z.string().min(1, 'Company name is required'),
  contact_email: z.string().email('Valid email is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirm_password: z.string(),
  states: z.array(z.string()).min(1, 'Select at least one state'),
  years_experience: z.number().min(0, 'Experience must be 0 or more').max(50, 'Maximum 50 years').optional(),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
  terms_accepted: z.boolean().refine(val => val === true, 'You must accept the terms of service'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type AgentFormData = z.infer<typeof agentSchema>;

const AgentSignup = () => {
  const navigate = useNavigate();
  const { createAgentProfile } = useAgents();
  const { signUp } = useAuth();
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      company_name: '',
      contact_email: '',
      password: '',
      confirm_password: '',
      states: [],
      years_experience: 0,
      bio: '',
      terms_accepted: false,
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
      // First, create the user account
      const { error: authError } = await signUp(data.contact_email, data.password, {
        first_name: data.first_name,
        last_name: data.last_name,
        company: data.company_name,
        user_type: 'registered_agent'
      });

      if (authError) {
        toast.error(authError.message || 'Failed to create account');
        return;
      }

      // Then create the agent profile
      await createAgentProfile({
        company_name: data.company_name,
        contact_email: data.contact_email,
        states: selectedStates,
        years_experience: data.years_experience,
        bio: data.bio,
        is_available: true,
      });
      
      toast.success('Account created successfully! Please check your email to verify your account.');
      navigate('/agent-dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Failed to create agent profile');
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
                <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Set Your Own Rates</p>
                  <p className="text-xs text-muted-foreground">Full control over your pricing and services</p>
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
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="First name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            This will be your login email and client contact email
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Password Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Account Security</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password *</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Create a secure password" {...field} />
                            </FormControl>
                            <FormDescription>
                              Minimum 8 characters with uppercase, lowercase, and number
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirm_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password *</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Professional Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Professional Details</h3>
                    
                    <FormField
                      control={form.control}
                      name="years_experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={50}
                              placeholder="5"
                              {...field}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                field.onChange(isNaN(value) ? 0 : value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            How many years have you been a registered agent?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                          Optional: Describe your expertise and services (max 500 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Terms and Conditions */}
                  <FormField
                    control={form.control}
                    name="terms_accepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I accept the <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> *
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting || !form.formState.isValid}>
                    {isSubmitting ? 'Creating Account...' : 'Create Agent Account'}
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