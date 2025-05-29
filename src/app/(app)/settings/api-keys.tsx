"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ApiKeysSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    nicehashApiKey: "",
    nicehashApiSecret: "",
    nicehashOrgId: "",
    hiveosToken: "",
    hiveosFarmId: "",
    ethermineWallet: ""
  });

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getDoc(doc(db, `users/${user.uid}/settings/apiKeys`))
      .then((d) => {
        if (d.exists()) setForm({ ...form, ...d.data() });
      })
      .catch((e) => setError(e.message || "Failed to load API keys"))
      .finally(() => setLoading(false));
  }, [user]);

  async function saveKeys(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await setDoc(doc(db, `users/${user.uid}/settings/apiKeys`), form, { merge: true });
      setSuccess("API keys saved!");
    } catch (e: any) {
      setError(e.message || "Failed to save API keys");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Mining API Keys & Credentials</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <form onSubmit={saveKeys} className="space-y-4">
            <div>
              <label className="block font-medium mb-1">NiceHash API Key</label>
              <Input name="nicehashApiKey" value={form.nicehashApiKey} onChange={handleChange} placeholder="NiceHash API Key" />
            </div>
            <div>
              <label className="block font-medium mb-1">NiceHash API Secret</label>
              <Input name="nicehashApiSecret" value={form.nicehashApiSecret} onChange={handleChange} placeholder="NiceHash API Secret" />
            </div>
            <div>
              <label className="block font-medium mb-1">NiceHash Org ID</label>
              <Input name="nicehashOrgId" value={form.nicehashOrgId} onChange={handleChange} placeholder="NiceHash Org ID" />
            </div>
            <div>
              <label className="block font-medium mb-1">HiveOS Token</label>
              <Input name="hiveosToken" value={form.hiveosToken} onChange={handleChange} placeholder="HiveOS Token" />
            </div>
            <div>
              <label className="block font-medium mb-1">HiveOS Farm ID</label>
              <Input name="hiveosFarmId" value={form.hiveosFarmId} onChange={handleChange} placeholder="HiveOS Farm ID" />
            </div>
            <div>
              <label className="block font-medium mb-1">Ethermine Wallet</label>
              <Input name="ethermineWallet" value={form.ethermineWallet} onChange={handleChange} placeholder="Ethermine Wallet Address" />
            </div>
            {error && <div className="text-red-500">{error}</div>}
            {success && <div className="text-green-500">{success}</div>}
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save API Keys"}</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
