// src/components/alerts/alert-item.tsx
import type { Alert } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Info, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlertItemProps {
  alert: Alert;
  onAcknowledge?: (alertId: string) => void;
}

const AlertIcon = ({ severity, type }: { severity: Alert['severity'], type: Alert['type'] }) => {
  if (severity === 'critical') return <AlertTriangle className="h-5 w-5 text-red-400" />;
  if (severity === 'warning') return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
  if (type === 'offline') return <AlertTriangle className="h-5 w-5 text-red-400" />;
  return <Info className="h-5 w-5 text-blue-400" />;
};

const SeverityBadge = ({ severity }: { severity: Alert['severity']}) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let className = "";
  switch(severity) {
    case 'critical':
      variant = "destructive";
      className = "bg-red-500/20 text-red-400 border-red-500/30";
      break;
    case 'warning':
      variant = "secondary";
      className = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      break;
    case 'info':
      variant = "default";
       className = "bg-blue-500/20 text-blue-400 border-blue-500/30";
      break;
  }
  return <Badge variant={variant} className={className}>{severity.charAt(0).toUpperCase() + severity.slice(1)}</Badge>;
}


export function AlertItem({ alert, onAcknowledge }: AlertItemProps) {
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card shadow-sm ${alert.acknowledged ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <AlertIcon severity={alert.severity} type={alert.type} />
        <div>
          <p className="font-semibold text-foreground">
            {alert.rigName ? `${alert.rigName}: ` : ''}{alert.message}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
            {alert.rigName && <span className="mx-1">&middot;</span>}
            {alert.rigName && `Type: ${alert.type}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
        <SeverityBadge severity={alert.severity} />
        {!alert.acknowledged && onAcknowledge && (
          <Button variant="outline" size="sm" onClick={() => onAcknowledge(alert.id)}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Acknowledge
          </Button>
        )}
      </div>
    </div>
  );
}
