import { Suspense } from 'react';
import { Logo } from '@/components/Logo';
import { SignInForm } from './sign-in-form';

export const metadata = { title: 'Sign in · SeeIt Admin' };

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-md">
          <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to the SeeIt admin dashboard.
          </p>
          <Suspense>
            <SignInForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Admin access only. Customer and restaurant accounts use the consumer apps.
        </p>
      </div>
    </main>
  );
}
