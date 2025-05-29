import React, { useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface ManualRigFormProps {
  rigId?: string; // If editing existing rig
  initialData?: Partial<{
    name: string;
    status: string;
    hashrate: number;
    power: number;
    notes: string;
  }>;
  onSave?: () => void;
}

export const ManualRigForm: React.FC<ManualRigFormProps> = ({ rigId, initialData = {}, onSave }) => {
  const { user } = useAuth();
  const [name, setName] = useState(initialData.name || '');
  const [status, setStatus] = useState(initialData.status || 'offline');
  const [hashrate, setHashrate] = useState(initialData.hashrate || 0);
  const [power, setPower] = useState(initialData.power || 0);
  const [notes, setNotes] = useState(initialData.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setError('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(collection(db, `users/${user.uid}/rigs`), rigId || name.replace(/\s+/g, '-').toLowerCase());
      await setDoc(docRef, {
        name,
        status,
        hashrate: Number(hashrate),
        power: Number(power),
        notes,
        platform: 'Manual',
        lastUpdated: Date.now(),
      }, { merge: true });
      if (onSave) onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save rig');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Rig Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select className="w-full border rounded px-2 py-1" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hashrate (MH/s)</label>
          <Input type="number" value={hashrate} onChange={e => setHashrate(Number(e.target.value))} min={0} step={0.01} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Power (W)</label>
          <Input type="number" value={power} onChange={e => setPower(Number(e.target.value))} min={0} step={1} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <Input value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Rig'}</Button>
      </form>
    </Card>
  );
};
