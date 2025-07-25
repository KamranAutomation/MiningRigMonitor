// To bind Firestore collection /users/{uid}/rigs in your dashboard page:
//
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '@/lib/firebase/config';
//
// async function fetchUserRigs(uid: string) {
//   const querySnapshot = await getDocs(collection(db, `users/${uid}/rigs`));
//   return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
// }
//
// Use this in your dashboard page to fetch rigs, then pass the stats to <StatsOverview />
//
// Example usage in dashboard page:
// const rigs = await fetchUserRigs(uid);
// <StatsOverview
//   totalRigs={rigs.length}
//   onlineRigs={rigs.filter(r => r.status === 'online').length}
//   totalHashrate={...}
//   totalPower={...}
// />

// src/components/dashboard/stats-overview.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, Zap, AlertCircle, CheckCircle, Activity } from 'lucide-react';

interface StatsOverviewProps {
  totalRigs: number;
  onlineRigs: number;
  totalHashrate: string; // e.g., "1.2 TH/s"
  totalPower: string; // e.g., "5.2 kW"
  errorRigs: number; // number of rigs with fetch errors
  totalEarningsUSD?: string; // total earnings in USD (optional)
}

const StatCard = ({ title, value, icon: Icon, colorClass = "text-primary" }: { title: string, value: string | number, icon: React.ElementType, colorClass?: string }) => (
  <Card className="shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${colorClass}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </CardContent>
  </Card>
);

export function StatsOverview({ totalRigs, onlineRigs, totalHashrate, totalPower, errorRigs, totalEarningsUSD }: StatsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      <StatCard title="Total Rigs" value={totalRigs} icon={Cpu} />
      <StatCard title="Online Rigs" value={`${onlineRigs} / ${totalRigs}`} icon={CheckCircle} colorClass={onlineRigs === totalRigs ? "text-green-500" : "text-yellow-500"} />
      <StatCard title="Rigs with Errors" value={errorRigs} icon={AlertCircle} colorClass={errorRigs > 0 ? "text-red-500" : "text-muted-foreground"} />
      <StatCard title="Total Hashrate" value={totalHashrate} icon={Activity} colorClass="text-accent" />
      <StatCard title="Total Power" value={totalPower} icon={Zap} colorClass="text-accent" />
      {typeof totalEarningsUSD !== 'undefined' && (
        <StatCard title="Total Earnings (USD)" value={totalEarningsUSD} icon={Cpu} colorClass="text-blue-500" />
      )}
    </div>
  );
}
