// src/app/loading.tsx
import { Loader2, CpuIcon } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-primary">
      <CpuIcon className="h-16 w-16 animate-pulse mb-4" />
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="mt-4 text-lg text-muted-foreground">Loading HashDash...</p>
    </div>
  );
}
