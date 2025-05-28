// src/components/settings/notification-settings-form.tsx
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const notificationSettingsSchema = z.object({
  emailOfflineAlerts: z.boolean().default(true),
  emailHashrateDropAlerts: z.boolean().default(true),
  emailTemperatureAlerts: z.boolean().default(false),
  pushNotificationsEnabled: z.boolean().default(false), // Placeholder for future push notifications
  systemUpdatesEmail: z.boolean().default(true),
});

type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;

export function NotificationSettingsForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // In a real app, you'd fetch and set defaultValues from user's stored preferences
  const form = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailOfflineAlerts: true,
      emailHashrateDropAlerts: true,
      emailTemperatureAlerts: false,
      pushNotificationsEnabled: false,
      systemUpdatesEmail: true,
    },
  });

  async function onSubmit(data: NotificationSettingsFormValues) {
    setIsLoading(true);
    // In a real app, you'd save these settings to Firestore or your backend
    console.log("Saving notification settings (simulated):", data);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    toast({ title: "Success", description: "Notification settings updated (simulated)." });
    setIsLoading(false);
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive alerts and updates.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            <FormField
              control={form.control}
              name="emailOfflineAlerts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Rig Offline Alerts</FormLabel>
                    <FormDescription>
                      Receive email notifications when a rig goes offline.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailHashrateDropAlerts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Hashrate Drop Alerts</FormLabel>
                    <FormDescription>
                      Get notified by email if a rig's hashrate drops significantly.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailTemperatureAlerts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">High Temperature Alerts</FormLabel>
                    <FormDescription>
                      Receive emails for critical temperature warnings.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="systemUpdatesEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">System Updates</FormLabel>
                    <FormDescription>
                      Receive emails about new features and important system updates.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Preferences
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
