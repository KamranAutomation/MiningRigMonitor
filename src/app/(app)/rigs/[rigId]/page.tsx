// src/app/(app)/rigs/[rigId]/page.tsx
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cpu, ArrowLeft, Edit3, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// This is a placeholder page. In a real app, you'd fetch rig details based on rigId.
// For example, using `async function getRigDetails(rigId: string) { ... }`

export default function RigDetailsPage({ params }: { params: { rigId: string } }) {
  const { rigId } = params;

  // Placeholder rig data - replace with actual data fetching logic
  const rig = {
    id: rigId,
    name: `Rig ${rigId.substring(0, 6)}`, // Example name based on ID
    status: 'online' as 'online' | 'offline' | 'error',
    hashrate: '500 MH/s',
    power: '1200W',
    temp: '65°C',
    fan: '70%',
    algorithm: 'Ethash',
    pool: 'ethermine.org',
    uptime: '2 days, 5 hours',
    gpus: [
      { id: 'gpu1', name: 'NVIDIA RTX 3080', temp: '68°C', fan: '72%', hashrate: '100 MH/s', power: '240W' },
      { id: 'gpu2', name: 'NVIDIA RTX 3080', temp: '62°C', fan: '68%', hashrate: '98 MH/s', power: '235W' },
      { id: 'gpu3', name: 'NVIDIA RTX 3070', temp: '60°C', fan: '65%', hashrate: '60 MH/s', power: '180W' },
    ]
  };

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title={rig.name}
        description={`Detailed information and statistics for ${rig.name}.`}
        icon={Cpu}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Link>
            </Button>
            <Button variant="outline">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Rig (soon)
            </Button>
             <Button variant="destructive" disabled> {/* Add delete functionality later */}
              <Trash2 className="mr-2 h-4 w-4" /> Delete Rig (soon)
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Key metrics for {rig.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-md mb-4">
              <Image src={`https://placehold.co/600x338.png?bg=3A3A3C&text=${rig.name.replace(/\s/g,'+')}`} alt={rig.name} layout="fill" objectFit="cover" data-ai-hint="mining rig hardware" />
            </div>
            <p><strong>Status:</strong> <span className={rig.status === 'online' ? 'text-green-400' : 'text-red-400'}>{rig.status.toUpperCase()}</span></p>
            <p><strong>Total Hashrate:</strong> {rig.hashrate}</p>
            <p><strong>Total Power:</strong> {rig.power}</p>
            <p><strong>Avg. Temperature:</strong> {rig.temp}</p>
            <p><strong>Avg. Fan Speed:</strong> {rig.fan}</p>
            <p><strong>Algorithm:</strong> {rig.algorithm}</p>
            <p><strong>Mining Pool:</strong> {rig.pool}</p>
            <p><strong>Uptime:</strong> {rig.uptime}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>GPU Details</CardTitle>
            <CardDescription>Performance of individual GPUs in {rig.name}</CardDescription>
          </CardHeader>
          <CardContent>
            {rig.gpus.length > 0 ? (
              <div className="space-y-4">
                {rig.gpus.map(gpu => (
                  <Card key={gpu.id} className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">{gpu.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <p>Hashrate: {gpu.hashrate}</p>
                      <p>Power: {gpu.power}</p>
                      <p>Temp: {gpu.temp}</p>
                      <p>Fan: {gpu.fan}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No GPU details available for this rig.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Placeholder for charts/graphs */}
      <Card className="mt-6 shadow-lg">
        <CardHeader>
          <CardTitle>Performance History (Placeholder)</CardTitle>
          <CardDescription>Historical data for hashrate, temperature, and power.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground bg-muted/30 rounded-b-lg">
          Chart will be displayed here.
          <div className="w-full h-full">
             <Image src="https://placehold.co/800x300.png?text=Performance+Chart" alt="Performance Chart Placeholder" width={800} height={300} className="object-cover w-full h-full opacity-30" data-ai-hint="data chart graph"/>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
