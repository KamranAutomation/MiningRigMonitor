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
import { Timestamp, collection as fsCollection, getDocs, orderBy, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/components/auth/auth-provider';

async function fetchUserRigs(uid: string) {
	const querySnapshot = await getDocs(fsCollection(db, `users/${uid}/rigs`));
	return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
}

export default function DashboardPage() {
	const { user } = useAuth();
	const [rigs, setRigs] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [payouts, setPayouts] = useState<any[]>([]);
	const uid = user?.uid;

	useEffect(() => {
		if (!uid) return;
		setLoading(true);
		fetchUserRigs(uid)
			.then(setRigs)
			.catch(e => setError(e.message || 'Failed to load rigs'))
			.finally(() => setLoading(false));
		// Fetch recent payouts
		(async () => {
			const payoutsQuery = query(
				fsCollection(db, `users/${uid}/payouts`),
				orderBy('timestamp', 'desc'),
				limit(5)
			);
			const snapshot = await getDocs(payoutsQuery);
			setPayouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
		})();
	}, [uid]);

	// Calculate stats from live data
	const totalRigs = rigs.length;
	const onlineRigs = rigs.filter(rig => rig.status === 'online').length;
	const errorRigs = rigs.filter(rig => rig.fetchError).length;
	const totalHashrate = rigs.length > 0 ?
		(rigs.reduce((sum, r) => sum + (r.hashrate || 0), 0).toFixed(2) + ' MH/s') : '--';
	const totalPower = rigs.length > 0 ?
		((rigs.reduce((sum, r) => sum + (r.powerConsumption || 0), 0) / 1000).toFixed(2) + ' kW') : '--';

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
				errorRigs={errorRigs}
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
						<span className="text-2xl font-bold">{'--'}</span>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Last Payout</CardTitle>
					</CardHeader>
					<CardContent>
						{payouts.length > 0 ? (
							<>
								<span className="text-2xl font-bold">{payouts[0].amount} BTC</span>
								<div className="text-muted-foreground text-sm">
									{payouts[0].provider} to {payouts[0].address}<br />
									{payouts[0].timestamp ? new Date(payouts[0].timestamp).toLocaleString() : ''}
								</div>
							</>
						) : (
							<>
								<span className="text-2xl font-bold">{'--'}</span>
								<div className="text-muted-foreground text-sm">{'--'}</div>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Recent payout history */}
			<div className="mt-8">
				<h2 className="text-xl font-semibold mb-4 text-foreground">Recent Payouts</h2>
				{payouts.length === 0 ? (
					<div className="text-muted-foreground">No payouts yet.</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="text-muted-foreground">
									<th className="px-2 py-1 text-left">Date</th>
									<th className="px-2 py-1 text-left">Amount</th>
									<th className="px-2 py-1 text-left">Provider</th>
									<th className="px-2 py-1 text-left">Address</th>
									<th className="px-2 py-1 text-left">Status</th>
								</tr>
							</thead>
							<tbody>
								{payouts.map((p) => (
									<tr key={p.id}>
										<td className="px-2 py-1">{p.timestamp ? new Date(p.timestamp).toLocaleString() : ''}</td>
										<td className="px-2 py-1">{p.amount} BTC</td>
										<td className="px-2 py-1">{p.provider}</td>
										<td className="px-2 py-1 truncate max-w-xs">{p.address}</td>
										<td className="px-2 py-1">{p.status}</td>
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
