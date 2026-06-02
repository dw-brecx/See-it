import { Suspense } from 'react';
import Link from 'next/link';
import { Camera, ChefHat, Sparkles, Star } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { SignUpForm } from './sign-up-form';

export const metadata = { title: 'Create account · SeeIt for Restaurants' };

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-warm-wash p-10 lg:flex xl:p-14">
        <div className="absolute inset-0 bg-warm-grid opacity-50" aria-hidden />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-terracotta-200/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-terracotta-100/50 blur-3xl" aria-hidden />

        <div className="relative">
          <Logo size="lg" />
        </div>

        <div className="relative space-y-8">
          <div className="max-w-md space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-terracotta-200 bg-terracotta-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-terracotta-700">
              <Sparkles className="h-3 w-3" />
              Create your account
            </div>
            <h2 className="text-[34px] font-bold leading-[1.1] tracking-tight text-foreground xl:text-[40px]">
              Get on SeeIt in under five minutes.
            </h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Free to claim your listing. Pull your info from Google with one
              click, upload a few photos, and you're live. Real diners discover
              your restaurant through real food.
            </p>
          </div>
          <ul className="space-y-3 text-[13.5px] text-muted-foreground max-w-md">
            <li className="flex items-center gap-2"><ChefHat className="h-4 w-4 text-terracotta-500" /> One listing, every location</li>
            <li className="flex items-center gap-2"><Camera className="h-4 w-4 text-terracotta-500" /> Photo galleries with featured items</li>
            <li className="flex items-center gap-2"><Star className="h-4 w-4 text-terracotta-500" /> AI-assisted review replies</li>
          </ul>
        </div>

        <div className="relative text-[12px] text-muted-foreground">
          Free trial · No credit card required
        </div>
      </aside>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8 sm:py-14">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex justify-start lg:hidden">
            <Logo size="md" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-[26px] font-bold tracking-tight text-foreground">
              Create your account
            </h1>
            <p className="text-[14px] text-muted-foreground">
              Get your restaurant on SeeIt. Free to start.
            </p>
          </div>

          <Suspense>
            <SignUpForm />
          </Suspense>

          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/signin"
              className="font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
