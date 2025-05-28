// src/app/(app)/dashboard/page.tsx
import { PageHeader } from '@/components/shared/page-header';
import { RigCard } from '@/components/dashboard/rig-card';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import type { Rig } from '@/types';
import { Home, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Placeholder data - replace with actual data fetching
const placeholderRigs: Rig[] = [
  { id: '1', name: 'Titan Alpha', hashrate: 550, hashrateUnit: 'MH/s', powerConsumption: 1200, status: 'online', algorithm: 'Ethash', temperature: 65, fanSpeed: 70 },
  { id: '2', name: 'Neptune Miner', hashrate: 1.2, hashrateUnit: 'GH/s', powerConsumption: 800, status: 'offline', algorithm: 'SHA-256', temperature: 40, fanSpeed: 50 },
  { id: '3', name: 'Orion Rig X', hashrate: 35, hashrateUnit: 'TH/s', powerConsumption: 3200, status: 'warning', algorithm: 'Scrypt', temperature: 75, fanSpeed: 85 },
  { id: '4', name: 'CyberRig V1', hashrate: 750, hashrateUnit: 'MH/s', powerConsumption: 1500, status: 'online', algorithm: 'KawPow', temperature: 60, fanSpeed: 60 },
  { id: '5', name: 'Mining Beast', hashrate: 95, hashrateUnit: 'Sol/s', powerConsumption: 950, status: 'error', algorithm: 'Equihash', temperature: 80, fanSpeed: 90 },
];

export default function DashboardPage() {
  // Calculate overview stats from placeholder data
  const totalRigs = placeholderRigs.length;
  const onlineRigs = placeholderRigs.filter(rig => rig.status === 'online').length;
  // These are simplified, real calculations would be more complex
  const totalHashrate = placeholderRigs.reduce((sum, rig) => sum + rig.hashrate, 0).toFixed(1) + " Aggregate Units"; 
  const totalPower = (placeholderRigs.reduce((sum, rig) => sum + rig.powerConsumption, 0) / 1000).toFixed(1) + " kW";

  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Dashboard" 
        description="Overview of your mining operations."
        icon={Home}
        actions={
          <Button asChild>
            <Link href="/add-rig">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Rig
            </Link>
          </Button>
        }
      />
      
      <StatsOverview 
        totalRigs={totalRigs}
        onlineRigs={onlineRigs}
        totalHashrate={totalHashrate}
        totalPower={totalPower}
      />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Your Rigs</h2>
        {placeholderRigs.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {placeholderRigs.map((rig) => (
              <RigCard key={rig.id} rig={rig} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-card rounded-lg shadow">
            <p className="text-muted-foreground">No rigs added yet.</p>
            <Button asChild className="mt-4">
              <Link href="/add-rig">Add Your First Rig</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
