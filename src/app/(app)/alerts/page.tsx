// src/app/(app)/alerts/page.tsx
"use client"; // Required for state and event handlers

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { AlertItem } from '@/components/alerts/alert-item';
import type { Alert } from '@/types';
import { Bell, XCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Placeholder data - replace with actual data fetching
const initialAlerts: Alert[] = [
  { id: '1', rigId: '2', rigName: 'Neptune Miner', type: 'offline', message: 'Rig went offline unexpectedly.', timestamp: new Date(Date.now() - 3600000), severity: 'critical', acknowledged: false },
  { id: '2', rigId: '3', rigName: 'Orion Rig X', type: 'hashrate_drop', message: 'Hashrate dropped by 20%.', timestamp: new Date(Date.now() - 7200000), severity: 'warning', acknowledged: false },
  { id: '3', rigId: '5', rigName: 'Mining Beast', type: 'temperature_high', message: 'GPU temperature exceeds 85°C.', timestamp: new Date(Date.now() - 10800000), severity: 'critical', acknowledged: true },
  { id: '4', type: 'custom', message: 'System maintenance scheduled for tonight.', timestamp: new Date(Date.now() - 86400000), severity: 'info', acknowledged: true },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('active');

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
    // Here you would also call an API to update the alert status in the backend
  };

  const handleAcknowledgeAll = () => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        !alert.acknowledged ? { ...alert, acknowledged: true } : alert
      )
    );
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'active') return !alert.acknowledged;
    if (filter === 'acknowledged') return alert.acknowledged;
    return true;
  });

  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Alerts"
        description="View and manage system and rig alerts."
        icon={Bell}
        actions={
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(value: 'all' | 'active' | 'acknowledged') => setFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter alerts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Alerts</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="all">All Alerts</SelectItem>
              </SelectContent>
            </Select>
            {alerts.some(a => !a.acknowledged) && (
               <Button onClick={handleAcknowledgeAll} variant="outline">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Acknowledge All
              </Button>
            )}
          </div>
        }
      />
      
      {filteredAlerts.length > 0 ? (
        <div className="space-y-4">
          {filteredAlerts
            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((alert) => (
            <AlertItem key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card p-12 text-center shadow-sm">
          <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No {filter} alerts</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {filter === 'active' ? "Everything looks good!" : "No alerts match your current filter."}
          </p>
        </div>
      )}
    </div>
  );
}
