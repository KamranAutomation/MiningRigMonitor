// src/components/dashboard/rig-card.tsx
import type { Rig } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cpu, Zap, Thermometer, Wind, AlertTriangle, CheckCircle2, Activity, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface RigCardProps {
  rig: Rig;
  onDelete?: (id: string) => void;
}

const StatusIndicator = ({ status }: { status: Rig['status'] }) => {
  switch (status) {
    case 'online':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'offline':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'error':
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    default:
      return <Activity className="h-5 w-5 text-muted-foreground" />;
  }
};

export function RigCard({ rig, onDelete }: RigCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Card className="flex flex-col overflow-hidden shadow-lg transition-all hover:shadow-xl hover:scale-[1.01]">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold text-primary">{rig.name}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{rig.algorithm || 'N/A'}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIndicator status={rig.status} />
            <Badge variant={rig.status === 'online' ? 'default' : (rig.status === 'offline' ? 'destructive' : 'secondary')} 
                   className={rig.status === 'online' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                              rig.status === 'offline' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}>
              {rig.status.charAt(0).toUpperCase() + rig.status.slice(1)}
            </Badge>
            {onDelete && (
              <AlertDialogTrigger asChild>
                <button
                  title="Delete Rig"
                  className="ml-2 p-1 rounded hover:bg-red-100 text-red-500 transition-colors"
                  aria-label="Delete Rig"
                  onClick={e => { e.stopPropagation(); setOpen(true); }}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </AlertDialogTrigger>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3 pt-2">
          <div className="relative h-32 w-full overflow-hidden rounded-md">
           <Image src={`https://placehold.co/600x400.png?bg=${rig.status === 'online' ? '3A3A3C' : '5A3A3C'}&text=${rig.name.replace(/\s/g,'+')}`} alt={rig.name} layout="fill" objectFit="cover" data-ai-hint="mining rig" />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-accent" />
            <span>{rig.hashrate} {rig.hashrateUnit}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-accent" />
            <span>{rig.powerConsumption} W</span>
          </div>
          {rig.temperature !== undefined && (
            <div className="flex items-center space-x-2">
              <Thermometer className="h-4 w-4 text-accent" />
              <span>{rig.temperature}°C</span>
            </div>
          )}
          {rig.fanSpeed !== undefined && (
            <div className="flex items-center space-x-2">
              <Wind className="h-4 w-4 text-accent" />
              <span>{rig.fanSpeed}%</span>
            </div>
          )}
        </div>
        
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full border-primary text-primary hover:bg-primary/10" asChild>
          <Link href={`/rigs/${rig.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Rig</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete <b>{rig.name}</b>? This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => setOpen(false)}>
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={() => { setOpen(false); onDelete && onDelete(rig.id); }}
          className="bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 focus:ring-2 focus:ring-red-400"
        >
          <Trash2 className="h-5 w-5" /> Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
    </AlertDialog>
  );
}
