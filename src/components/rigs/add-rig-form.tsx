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

const rigSchema = z.object({
  name: z.string().min(3, { message: "Rig name must be at least 3 characters." }),
  algorithm: z.string().min(2, { message: "Algorithm is required." }),
  hashrate: z.coerce.number().positive({ message: "Hashrate must be a positive number." }),
  hashrateUnit: z.string().min(1, { message: "Hashrate unit is required." }),
  powerConsumption: z.coerce.number().positive({ message: "Power consumption must be positive." }),
  location: z.string().optional(),
});

type RigFormValues = z.infer<typeof rigSchema>;

// Dummy server action - replace with actual implementation
async function addRigAction(data: RigFormValues): Promise<{ success: boolean; message: string }> {
  console.log("Submitting rig data:", data);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  // Simulate success/failure
  if (data.name.toLowerCase().includes("fail")) {
    return { success: false, message: "Simulated failure: Rig name contains 'fail'." };
  }
  return { success: true, message: "Rig added successfully (simulated)!" };
}


export function AddRigForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RigFormValues>({
    resolver: zodResolver(rigSchema),
    defaultValues: {
      name: '',
      algorithm: '',
      hashrate: undefined,
      hashrateUnit: 'MH/s',
      powerConsumption: undefined,
      location: '',
    },
  });

  async function onSubmit(data: RigFormValues) {
    setIsLoading(true);
    try {
      // Here you would call a server action or API endpoint
      const result = await addRigAction(data);
      if (result.success) {
        toast({ title: "Success", description: result.message });
        form.reset();
        router.push('/dashboard'); // Redirect after successful submission
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
