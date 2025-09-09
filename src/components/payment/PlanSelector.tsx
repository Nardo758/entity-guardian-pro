import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Check, Star } from 'lucide-react';
import { STRIPE_PRICING_TIERS } from '@/lib/stripe';

interface PlanSelectorProps {
  selectedPlan: string;
  selectedBilling: 'monthly' | 'yearly';
  onPlanChange: (plan: string) => void;
  onBillingChange: (billing: 'monthly' | 'yearly') => void;
  className?: string;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  selectedPlan,
  selectedBilling,
  onPlanChange,
  onBillingChange,
  className = ''
}) => {
  const tiers = Object.values(STRIPE_PRICING_TIERS);
  const selectedTierData = STRIPE_PRICING_TIERS[selectedPlan as keyof typeof STRIPE_PRICING_TIERS];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Billing Toggle */}
      <div className="flex items-center justify-center">
        <div className="bg-muted p-1 rounded-lg flex">
          <Button
            type="button"
            variant={selectedBilling === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onBillingChange('monthly')}
            className="rounded-md"
          >
            Monthly
          </Button>
          <Button
            type="button"
            variant={selectedBilling === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onBillingChange('yearly')}
            className="rounded-md"
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">
              Save 17%
            </Badge>
          </Button>
        </div>
      </div>

      {/* Plan Selection */}
      <RadioGroup value={selectedPlan} onValueChange={onPlanChange} className="space-y-4">
        {Object.values(STRIPE_PRICING_TIERS).map((tier) => (
          <div key={tier.id} className="relative">
            <Label
              htmlFor={tier.id}
              className="cursor-pointer"
            >
              <Card className={`transition-all duration-200 hover:shadow-md ${
                selectedPlan === tier.id 
                  ? 'ring-2 ring-primary border-primary' 
                  : ''
              } ${tier.popular ? 'border-primary/50' : ''}`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={tier.id} id={tier.id} />
                      <div>
                        <CardTitle className="text-lg">{tier.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{tier.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ${selectedBilling === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        per {selectedBilling === 'monthly' ? 'month' : 'year'}
                      </div>
                      {selectedBilling === 'yearly' && (
                        <div className="text-xs text-green-600 font-medium">
                          Save ${(tier.monthlyPrice * 12) - tier.yearlyPrice} annually
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                     <div className="text-sm font-medium">
                       {typeof tier.entities === 'number' ? `${tier.entities} entities included` : tier.entities}
                     </div>
                     {tier.perEntityCost && (
                       <div className="text-xs text-muted-foreground">
                         {tier.perEntityCost}
                       </div>
                     )}
                    <div className="space-y-2">
                      {tier.features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                      {tier.features.length > 4 && (
                        <div className="text-xs text-muted-foreground">
                          +{tier.features.length - 4} more features
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {/* Selected Plan Summary */}
      {selectedTierData && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Selected Plan: {selectedTierData.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedBilling === 'yearly' ? 'Annual' : 'Monthly'} billing
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">
                  ${selectedBilling === 'monthly' ? selectedTierData.monthlyPrice : selectedTierData.yearlyPrice}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedBilling === 'yearly' ? 'per year' : 'per month'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};