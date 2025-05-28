// src/app/(app)/pricing/page.tsx
import { PageHeader } from '@/components/shared/page-header';
import { PricingCard } from '@/components/pricing/pricing-card';
import type { PricingPlan } from '@/types';
import { DollarSign } from 'lucide-react';

// Placeholder data - replace with actual data from your backend/config
const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Hobbyist',
    price: 'Free',
    features: [
      'Monitor up to 1 rig',
      'Basic alerts (offline)',
      'Community support',
      '7-day data retention',
    ],
    rigsAllowed: 1,
    ctaText: 'Get Started',
  },
  {
    id: 'pro',
    name: 'Pro Miner',
    price: '$19/month',
    features: [
      'Monitor up to 10 rigs',
      'Advanced alerts (hashrate, temp)',
      'Email support',
      '30-day data retention',
      'Customizable dashboard',
    ],
    rigsAllowed: 10,
    ctaText: 'Choose Plan',
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Mining Farm',
    price: '$99/month',
    features: [
      'Monitor unlimited rigs',
      'All alert types + SMS option',
      'Priority support',
      '1-year data retention',
      'API Access (soon)',
      'Team accounts (soon)',
    ],
    rigsAllowed: 'unlimited',
    ctaText: 'Choose Plan',
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Pricing Plans"
        description="Choose the plan that best fits your mining operation."
        icon={DollarSign}
      />
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <h3 className="text-xl font-semibold text-foreground">Need a custom solution?</h3>
        <p className="mt-2 text-muted-foreground">
          Contact us for tailored plans for large-scale operations.
        </p>
        <a href="mailto:sales@hashdash.example.com" className="mt-4 inline-block text-primary hover:underline">
          Contact Sales
        </a>
      </div>
    </div>
  );
}
