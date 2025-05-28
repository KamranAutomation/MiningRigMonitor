// src/app/(app)/layout.tsx
"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { signOut } from '@/lib/firebase/auth';
import { Home, BarChart3, PlusCircle, Bell, Settings, DollarSign, LogOut, CpuIcon, PanelLeft } from 'lucide-react'; // Added CpuIcon
import Image from 'next/image';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', tooltip: 'Dashboard' },
  { href: '/add-rig', icon: PlusCircle, label: 'Add Rig', tooltip: 'Add New Rig' },
  { href: '/alerts', icon: Bell, label: 'Alerts', tooltip: 'View Alerts' },
  { href: '/settings', icon: Settings, label: 'Settings', tooltip: 'App Settings' },
  { href: '/pricing', icon: DollarSign, label: 'Pricing', tooltip: 'Subscription Plans' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // Optionally show a loading spinner specific to this layout
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
         <CpuIcon className="h-16 w-16 animate-pulse text-primary" />
      </div>
    );
  }
  
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Failed to sign out', error);
      // Handle error (e.g., show a toast notification)
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader className="p-4 items-center">
          <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <CpuIcon className="h-8 w-8 text-primary transition-transform duration-300 group-hover:rotate-[15deg]" />
            <h1 className="text-2xl font-bold text-primary group-data-[collapsible=icon]:hidden">HashDash</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton tooltip={{ children: item.tooltip, side: 'right', align: 'center' }}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex w-full items-center justify-start gap-2 p-2 group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} data-ai-hint="user avatar" />
                  <AvatarFallback>{user.email ? user.email[0].toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
                <span className="group-data-[collapsible=icon]:hidden">{user.displayName || user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/settings" passHref>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:h-16 sm:px-6">
          <SidebarTrigger className="md:hidden">
             <PanelLeft />
          </SidebarTrigger>
          {/* Optional: Add breadcrumbs or page title here */}
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
