// src/components/pricing/pricing-card.tsx
import type { PricingPlan } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Star } from 'lucide-react';

interface PricingCardProps {
  plan: PricingPlan;
}

export function PricingCard({ plan }: PricingCardProps) {
  return (
    <Card className={`flex flex-col shadow-xl ${plan.isPopular ? 'border-primary border-2 relative' : 'border-border'}`}>
      {plan.isPopular && (
        <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-full shadow-md flex items-center">
          <Star className="w-3 h-3 mr-1 fill-current" /> Popular
        </div>
      )}
      <CardHeader className="pb-4">
        <CardTitle className={`text-2xl font-bold ${plan.isPopular ? 'text-primary' : 'text-foreground'}`}>{plan.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground pt-1">{plan.price}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start text-sm">
              <CheckCircle2 className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
              <span className="text-foreground/90">{feature}</span>
            </li>
          ))}
        </ul>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Rigs Allowed:</span> {plan.rigsAllowed === 'unlimited' ? 'Unlimited' : plan.rigsAllowed}
        </div>
      </CardContent>
      <CardFooter>
        <Button className={`w-full ${plan.isPopular ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}>
          {plan.ctaText}
        </Button>
      </CardFooter>
    </Card>
  );
}
