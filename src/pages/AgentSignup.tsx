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
  password: z.string().min(8, 'Password must be at least 8 characters'),
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

      // Step 3: Assign registered_agent role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'registered_agent' as any // Type assertion until database types refresh
        });

      if (roleError) {
        console.error('Role assignment error:', roleError);
        toast.error('Account created but failed to assign agent role. Please contact support.');
        return;
      }

      // Step 4: Create agent profile (without pricing - to be set later in dashboard)
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6 p-8 bg-card shadow-2xl rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Agent Signup Disabled</h1>
        <p className="text-muted-foreground">New agent registration is not enabled in this project. If you are an existing agent, <Link to="/login" className="text-primary hover:underline font-medium">sign in here</Link>. For other questions, contact support.</p>
        <p className="text-xs text-muted-foreground mt-4">Need help? <Link to="/support" className="text-primary hover:underline">Contact Support</Link></p>
      </div>
    </div>
  );
};

export default AgentSignup;