"use client";

// src/app/(app)/rigs/[rigId]/page.tsx
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cpu, ArrowLeft, Edit3, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Rig } from '@/types';

// TODO: Replace with actual auth logic to get current user's UID
function getCurrentUserUid() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('uid');
  }
  return null;
}

export default function RigDetailsPage({ params }: { params: { rigId: string } }) {
  const { rigId } = params;
  const [rig, setRig] = useState<Rig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRig() {
      setLoading(true);
      setError(null);
      try {
        const uid = getCurrentUserUid();
        if (!uid) {
          setError('User not authenticated.');
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/rigs?uid=${uid}`);
        if (!res.ok) throw new Error('Failed to fetch rig data');
        const data = await res.json();
        const found = Array.isArray(data) ? data.find((r: Rig) => r.id === rigId) : null;
        setRig(found || null);
      } catch (e: any) {
        setError(e.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchRig();
  }, [rigId]);

  if (loading) {
    return <div className="container mx-auto py-2 text-center">Loading rig details...</div>;
  }
  if (error) {
    return <div className="container mx-auto py-2 text-center text-red-500">{error}</div>;
  }
  if (!rig) {
    return <div className="container mx-auto py-2 text-center text-muted-foreground">Rig not found.</div>;
  }

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
            <Button variant="destructive" disabled>
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
            <p><strong>Total Hashrate:</strong> {rig.hashrate} {rig.hashrateUnit}</p>
            <p><strong>Total Power:</strong> {rig.powerConsumption} W</p>
            <p><strong>Avg. Temperature:</strong> {rig.temperature !== undefined ? `${rig.temperature}°C` : '--'}</p>
            <p><strong>Avg. Fan Speed:</strong> {rig.fanSpeed !== undefined ? `${rig.fanSpeed}%` : '--'}</p>
            <p><strong>Algorithm:</strong> {rig.algorithm || '--'}</p>
            <p><strong>Mining Pool:</strong> {rig.pool || '--'}</p>
            <p><strong>Uptime:</strong> {rig.uptime ? `${Math.floor(rig.uptime / 3600)}h ${(rig.uptime % 3600) / 60}m` : '--'}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>GPU Details</CardTitle>
            <CardDescription>Performance of individual GPUs in {rig.name}</CardDescription>
          </CardHeader>
          <CardContent>
            {rig.gpuDetails && rig.gpuDetails.length > 0 ? (
              <div className="space-y-4">
                {rig.gpuDetails.map(gpu => (
                  <Card key={gpu.id} className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">{gpu.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <p>Hashrate: {gpu.hashrate}</p>
                      <p>Power: {gpu.power}</p>
                      <p>Temp: {gpu.temperature}</p>
                      <p>Fan: {gpu.fanSpeed}</p>
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
          <CardTitle>Performance History (Coming Soon)</CardTitle>
          <CardDescription>Historical data for hashrate, temperature, and power.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground bg-muted/30 rounded-b-lg">
          Chart will be displayed here.
        </CardContent>
      </Card>
    </div>
  );
}
