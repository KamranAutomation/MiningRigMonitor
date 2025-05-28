// src/app/(auth)/login/page.tsx
import { LoginForm } from '@/components/auth/login-form';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { CpuIcon } from 'lucide-react';

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <CpuIcon className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight text-primary">HashDash Login</CardTitle>
        <CardDescription className="text-muted-foreground">
          Access your crypto rig monitoring dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LoginForm />
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <OAuthButtons />
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 text-sm">
        {/* Placeholder for Sign Up and Forgot Password links */}
        <p className="text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="#" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
        <Link href="#" className="font-medium text-primary hover:underline">
            Forgot your password?
        </Link>
      </CardFooter>
    </Card>
  );
}
