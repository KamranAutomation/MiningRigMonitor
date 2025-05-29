// src/components/rigs/add-rig-form.tsx
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, collection as fsCollection } from 'firebase/firestore';
import { useAuth } from '@/components/auth/auth-provider';

const rigSchema = z.object({
  name: z.string().min(3, { message: "Rig name must be at least 3 characters." }),
  platform: z.enum(["NiceHash", "HiveOS", "Ethermine", "Manual"]),
  algorithm: z.string().min(2, { message: "Algorithm is required." }),
  hashrate: z.coerce.number().positive({ message: "Hashrate must be a positive number." }),
  hashrateUnit: z.string().min(1, { message: "Hashrate unit is required." }),
  powerConsumption: z.coerce.number().positive({ message: "Power consumption must be positive." }),
  location: z.string().optional(),
  // Platform-specific fields (optional, validated in UI)
  nicehashApiKey: z.string().optional(),
  nicehashApiSecret: z.string().optional(),
  nicehashOrgId: z.string().optional(),
  hiveosToken: z.string().optional(),
  hiveosFarmId: z.string().optional(),
  ethermineWallet: z.string().optional(),
});

type RigFormValues = z.infer<typeof rigSchema>;

export function AddRigForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [platform, setPlatform] = useState<"NiceHash" | "HiveOS" | "Ethermine" | "Manual">("NiceHash");

  async function addRigAction(data: RigFormValues, user: { uid: string } | null): Promise<{ success: boolean; message: string }> {
    if (!user || !user.uid) {
      if (typeof window !== 'undefined') {
        window.alert('You must be logged in to add a rig. Redirecting to login...');
        window.location.href = '/login';
      }
      return { success: false, message: 'User not authenticated.' };
    }
    try {
      const rigsCol = fsCollection(db, `users/${user.uid}/rigs`);
      const newRigRef = doc(rigsCol);
      await setDoc(newRigRef, {
        ...data,
        status: 'online', // Default status
        createdAt: Date.now(),
      });
      return { success: true, message: 'Rig added successfully!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to add rig.' };
    }
  }

  const form = useForm<RigFormValues>({
    resolver: zodResolver(rigSchema),
    defaultValues: {
      name: '',
      platform: 'NiceHash',
      algorithm: '',
      hashrate: 0,
      hashrateUnit: 'MH/s',
      powerConsumption: 0,
      location: '',
      nicehashApiKey: '',
      nicehashApiSecret: '',
      nicehashOrgId: '',
      hiveosToken: '',
      hiveosFarmId: '',
      ethermineWallet: '',
    },
  });

  async function onSubmit(data: RigFormValues) {
    setIsLoading(true);
    try {
      const result = await addRigAction(data, user);
      if (result.success) {
        toast({ title: "Success", description: result.message });
        form.reset();
        router.push('/dashboard'); // Redirect after successful submission
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      console.error('AddRigForm error:', error);
      toast({ title: "Error", description: error?.message || String(error) || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  const hashrateUnits = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'Sol/s'];

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Add New Mining Rig</CardTitle>
        <CardDescription>Enter the details for your new mining rig.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => addRigAction({ ...data, platform }, user))} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rig Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Antminer S19 Pro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Platform</FormLabel>
              <Select value={platform} onValueChange={v => setPlatform(v as "NiceHash" | "HiveOS" | "Ethermine" | "Manual")}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="NiceHash">NiceHash</SelectItem>
                  <SelectItem value="HiveOS">HiveOS</SelectItem>
                  <SelectItem value="Ethermine">Ethermine</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
            {/* Platform-specific fields */}
            {platform === 'NiceHash' && (
              <>
                <FormField
                  control={form.control}
                  name="nicehashApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NiceHash API Key</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter NiceHash API Key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nicehashApiSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NiceHash API Secret</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter NiceHash API Secret" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nicehashOrgId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NiceHash Organization ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter NiceHash Org ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {platform === 'HiveOS' && (
              <>
                <FormField
                  control={form.control}
                  name="hiveosToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HiveOS API Token</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter HiveOS API Token" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hiveosFarmId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HiveOS Farm ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter HiveOS Farm ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {platform === 'Ethermine' && (
              <FormField
                control={form.control}
                name="ethermineWallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ethermine Wallet Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Ethermine Wallet Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="algorithm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Algorithm</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SHA-256, Ethash" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="hashrate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hashrate</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 110" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hashrateUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hashrate Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hashrateUnits.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="powerConsumption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Power Consumption (Watts)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 3250" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Basement Rack 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Rig
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
