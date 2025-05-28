// src/app/error.tsx
"use client"; 

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
      <h2 className="text-3xl font-semibold text-foreground mb-2">Oops! Something went wrong.</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        {error.message || "An unexpected error occurred. We've been notified and are looking into it."}
      </p>
      <Button
        onClick={() => reset()}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        Try Again
      </Button>
      <Button variant="link" onClick={() => window.location.href = '/dashboard'} className="mt-2 text-primary">
        Go to Dashboard
      </Button>
    </div>
  );
}
