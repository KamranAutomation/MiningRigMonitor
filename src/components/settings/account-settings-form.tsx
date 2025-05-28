// src/components/settings/account-settings-form.tsx
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const accountSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).optional(),
  email: z.string().email(),
  // photoURL: z.string().url().optional(), // For file upload, this would be handled differently
});

type AccountFormValues = z.infer<typeof accountSchema>;

export function AccountSettingsForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      displayName: '',
      email: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
        email: user.email || '',
      });
    }
  }, [user, form]);

  async function onSubmit(data: AccountFormValues) {
    setIsLoading(true);
    // In a real app, you'd update Firebase Auth profile here
    // e.g., updateProfile(auth.currentUser, { displayName: data.displayName, photoURL: ... })
    console.log("Updating account settings (simulated):", data);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    toast({ title: "Success", description: "Account settings updated (simulated)." });
    setIsLoading(false);
  }

  if (!user) {
    return <p className="text-muted-foreground">Loading user data...</p>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
        <CardDescription>Manage your account details.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} data-ai-hint="user avatar" />
                <AvatarFallback>{user.email ? user.email[0].toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              {/* Placeholder for avatar upload */}
              <Button type="button" variant="outline" disabled>Change Avatar (soon)</Button>
            </div>

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
