import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAgents } from '@/hooks/useAgents';
import { toast } from 'sonner';
import { DollarSign, Save } from 'lucide-react';

const pricingSchema = z.object({
  price_per_entity: z.number().min(50, 'Minimum price is $50').max(5000, 'Maximum price is $5000'),
});

type PricingFormData = z.infer<typeof pricingSchema>;

interface AgentPricingSettingsProps {
  agentId?: string;
  currentPrice?: number;
}

const AgentPricingSettings: React.FC<AgentPricingSettingsProps> = ({ 
  agentId, 
  currentPrice = 199 
}) => {
  const { updateAgentProfile, getUserAgent } = useAgents();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      price_per_entity: currentPrice,
    },
  });

  useEffect(() => {
    form.setValue('price_per_entity', currentPrice);
  }, [currentPrice, form]);

  const onSubmit = async (data: PricingFormData) => {
    if (!agentId) {
      toast.error('Agent profile not found');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAgentProfile(agentId, {
        price_per_entity: data.price_per_entity,
      });
      
      toast.success('Pricing updated successfully!');
    } catch (error) {
      console.error('Error updating pricing:', error);
      toast.error('Failed to update pricing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Pricing Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="price_per_entity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Fee Per Entity</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        className="pl-9"
                        placeholder="199"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Set your annual fee for serving as registered agent per entity. 
                    This is what clients will see when they invite you.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Pricing Recommendations</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Basic service: $99-199/year</li>
                <li>• Premium service: $200-399/year</li>
                <li>• Full-service packages: $400-1000/year</li>
                <li>• Specialized industries: $500+/year</li>
              </ul>
            </div>

            <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Update Pricing'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AgentPricingSettings;