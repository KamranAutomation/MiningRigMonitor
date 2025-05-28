"use client";

// src/app/(app)/dashboard/page.tsx
import { PageHeader } from '@/components/shared/page-header';
import { RigCard } from '@/components/dashboard/rig-card';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useEffect, useState } from 'react';
import { Home, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Rig } from '@/types';

function getCurrentUserUid() {
	// TODO: Replace with actual auth logic to get current user's UID
	// For now, try to get from localStorage or a global auth context
	if (typeof window !== 'undefined') {
		return localStorage.getItem('uid');
	}
	return null;
}

export default function DashboardPage() {
	const [rigs, setRigs] = useState<Rig[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [earnings, setEarnings] = useState<{ total: string; lastPayout: string; lastPayoutDate: string } | null>(null);

	useEffect(() => {
		async function fetchRigs() {
			setLoading(true);
			setError(null);
			try {
				const uid = getCurrentUserUid();
				if (!uid) {
					setError('User not authenticated.');
					setLoading(false);
					return;
				}
				const res = await fetch(`/api/rigs?uid=${uid}`);
				if (!res.ok) throw new Error('Failed to fetch rig data');
				const data = await res.json();
				setRigs(Array.isArray(data) ? data : []);
				// Optionally fetch earnings from another endpoint or calculate from rigs
				// setEarnings(...)
			} catch (e: any) {
				setError(e.message || 'Unknown error');
			} finally {
				setLoading(false);
			}
		}
		fetchRigs();
	}, []);

	// Calculate stats from live data
	const totalRigs = rigs.length;
	const onlineRigs = rigs.filter(rig => rig.status === 'online').length;
	const totalHashrate = rigs.reduce((sum, rig) => sum + (typeof rig.hashrate === 'number' ? rig.hashrate : 0), 0).toFixed(1) + (rigs[0]?.hashrateUnit ? ` ${rigs[0].hashrateUnit}` : '');
	const totalPower = (rigs.reduce((sum, rig) => sum + (rig.powerConsumption || 0), 0) / 1000).toFixed(1) + ' kW';

	return (
		<div className="container mx-auto py-2">
			<PageHeader
				title="Dashboard"
				description="Overview of your mining operations."
				icon={Home}
				actions={
					<Button asChild>
						<Link href="/add-rig">
							<PlusCircle className="mr-2 h-4 w-4" /> Add New Rig
						</Link>
					</Button>
				}
			/>

			<StatsOverview
				totalRigs={totalRigs}
				onlineRigs={onlineRigs}
				totalHashrate={totalHashrate}
				totalPower={totalPower}
			/>

			<div className="mt-8">
				<h2 className="text-xl font-semibold mb-4 text-foreground">Your Rigs</h2>
				{loading ? (
					<div className="text-center py-10 bg-card rounded-lg shadow">
						<p className="text-muted-foreground">Loading rig data...</p>
					</div>
				) : error ? (
					<div className="text-center py-10 bg-card rounded-lg shadow">
						<p className="text-red-500">{error}</p>
					</div>
				) : rigs.length > 0 ? (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{rigs.map((rig) => (
							<RigCard key={rig.id} rig={rig} />
						))}
					</div>
				) : (
					<div className="text-center py-10 bg-card rounded-lg shadow">
						<p className="text-muted-foreground">No rigs added yet.</p>
						<Button asChild className="mt-4">
							<Link href="/add-rig">Add Your First Rig</Link>
						</Button>
					</div>
				)}
			</div>

			{/* Earnings section (optional, placeholder for now) */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
				<Card>
					<CardHeader>
						<CardTitle>Total Earnings</CardTitle>
					</CardHeader>
					<CardContent>
						<span className="text-2xl font-bold">{earnings?.total || '--'}</span>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Last Payout</CardTitle>
					</CardHeader>
					<CardContent>
						<span className="text-2xl font-bold">{earnings?.lastPayout || '--'}</span>
						<div className="text-muted-foreground text-sm">on {earnings?.lastPayoutDate || '--'}</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
