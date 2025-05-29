// src/app/(app)/alerts/page.tsx
"use client"; // Required for state and event handlers

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PageHeader } from '@/components/shared/page-header';
import { Bell } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { collection as fsCollection, getDocs, orderBy, limit, query } from 'firebase/firestore';

// Placeholder data - replace with actual data fetching
const initialAlerts = [
  { id: '1', rigId: '2', rigName: 'Neptune Miner', type: 'offline', message: 'Rig went offline unexpectedly.', timestamp: new Date(Date.now() - 3600000), severity: 'critical', acknowledged: false },
  { id: '2', rigId: '3', rigName: 'Orion Rig X', type: 'hashrate_drop', message: 'Hashrate dropped by 20%.', timestamp: new Date(Date.now() - 7200000), severity: 'warning', acknowledged: false },
  { id: '3', rigId: '5', rigName: 'Mining Beast', type: 'temperature_high', message: 'GPU temperature exceeds 85°C.', timestamp: new Date(Date.now() - 10800000), severity: 'critical', acknowledged: true },
  { id: '4', type: 'custom', message: 'System maintenance scheduled for tonight.', timestamp: new Date(Date.now() - 86400000), severity: 'info', acknowledged: true },
];

export default function AlertsPage() {
  // Replace with your auth logic to get the current user's UID
  const uid = typeof window !== 'undefined' ? localStorage.getItem('uid') : null;
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [chatId, setChatId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getDoc(doc(db, `users/${uid}/settings/alerts`))
      .then((d) => {
        if (d.exists()) {
          const data = d.data();
          setEnabled(data.enabled !== false);
          setChatId(data.telegramChatId || '');
        }
      })
      .catch(e => setError(e.message || 'Failed to load alert settings'))
      .finally(() => setLoading(false));
    // Fetch recent alerts
    (async () => {
      const alertsQuery = query(
        fsCollection(db, `users/${uid}/alerts`),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(alertsQuery);
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));
    })();
  }, [uid]);

  async function saveSettings() {
    if (!uid) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await setDoc(doc(db, `users/${uid}/settings/alerts`), {
        enabled,
        telegramChatId: chatId,
      }, { merge: true });
      setSuccess('Settings saved!');
    } catch (e: any) {
      setError(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Alerts"
        description="Manage your mining rig alert settings."
        icon={Bell}
      />
      <div className="max-w-lg mx-auto bg-card rounded-lg shadow p-6 mt-6">
        {loading ? (
          <div className="text-center text-muted-foreground">Loading alert settings...</div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); saveSettings(); }}>
            <div className="mb-4 flex items-center justify-between">
              <label htmlFor="enabled" className="font-medium">Enable Telegram Alerts</label>
              <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
            </div>
            <div className="mb-4">
              <label htmlFor="chatId" className="font-medium block mb-1">Telegram Chat ID</label>
              <Input id="chatId" value={chatId} onChange={e => setChatId(e.target.value)} placeholder="Enter your Telegram Chat ID" />
              <div className="text-xs text-muted-foreground mt-1">Leave blank to use your default chat ID.</div>
            </div>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {success && <div className="text-green-500 mb-2">{success}</div>}
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
          </form>
        )}
      </div>
      {/* Recent Alerts Section */}
      <div className="max-w-2xl mx-auto mt-10">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Recent Alerts</h2>
        {alerts.length === 0 ? (
          <div className="text-muted-foreground">No alerts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="px-2 py-1 text-left">Time</th>
                  <th className="px-2 py-1 text-left">Type</th>
                  <th className="px-2 py-1 text-left">Rig</th>
                  <th className="px-2 py-1 text-left">Message</th>
                  <th className="px-2 py-1 text-left">Severity</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-2 py-1">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</td>
                    <td className="px-2 py-1">{a.type}</td>
                    <td className="px-2 py-1">{a.rigName || a.rigId || '-'}</td>
                    <td className="px-2 py-1">{a.message}</td>
                    <td className={`px-2 py-1 ${a.severity === 'critical' ? 'text-red-500' : a.severity === 'warning' ? 'text-yellow-500' : 'text-muted-foreground'}`}>{a.severity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
