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
  company_name: z.string().min(1, 'Company name is required'),
  contact_email: z.string().email('Valid email is required'),
  states: z.array(z.string()).min(1, 'Select at least one state'),
  price_per_entity: z.number().min(50, 'Minimum price is $50').max(2000, 'Maximum price is $2000'),
  years_experience: z.number().min(0).max(50).optional(),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
});

type AgentFormData = z.infer<typeof agentSchema>;

const AgentSignup = () => {
  const navigate = useNavigate();
  const { createAgentProfile } = useAgents();
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      company_name: '',
      contact_email: '',
      states: [],
      price_per_entity: 199,
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
    try {
      await createAgentProfile({
        company_name: data.company_name,
        contact_email: data.contact_email,
        states: selectedStates,
        price_per_entity: data.price_per_entity,
        years_experience: data.years_experience,
        bio: data.bio,
        is_available: true,
      });
      
      toast.success('Agent profile created successfully!');
      navigate('/agent-dashboard');
    } catch (error) {
      toast.error('Failed to create agent profile');
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
                          Clients will use this email to contact you directly
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price_per_entity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price Per Entity (Annual) *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                className="pl-9"
                                placeholder="199"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
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
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
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

                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Creating Profile...' : 'Create Agent Profile'}
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