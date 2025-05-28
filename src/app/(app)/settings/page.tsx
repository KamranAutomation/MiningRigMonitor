// src/app/(app)/settings/page.tsx
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountSettingsForm } from '@/components/settings/account-settings-form';
import { NotificationSettingsForm } from '@/components/settings/notification-settings-form';
import { Settings as SettingsIcon, UserCircle, Bell } from 'lucide-react'; // Renamed Settings to SettingsIcon to avoid conflict

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Settings"
        description="Manage your account and notification preferences."
        icon={SettingsIcon}
      />
      
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
          <TabsTrigger value="account">
            <UserCircle className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <AccountSettingsForm />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
