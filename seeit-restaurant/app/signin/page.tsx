import { Suspense } from 'react';
import Link from 'next/link';
import { Camera, ChefHat, MapPin, Sparkles, Star } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { SignInForm } from './sign-in-form';

export const metadata = { title: 'Sign in · SeeIt for Restaurants' };

const HIGHLIGHTS = [
  {
    icon: ChefHat,
    title: 'Own your story',
    description: 'Photos, descriptions, hours — the way you want them.',
  },
  {
    icon: Star,
    title: 'Reply to every review',
    description: 'Build trust by responding — with AI-assisted drafts.',
  },
  {
    icon: Camera,
    title: 'Real food, real diners',
    description: 'Real photos and ratings, with no fake reviews.',
  },
];

export default function SignInPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-warm-wash p-10 lg:flex xl:p-14">
        <div className="absolute inset-0 bg-warm-grid opacity-50" aria-hidden />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-terracotta-200/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-terracotta-100/50 blur-3xl" aria-hidden />

        <div className="relative">
          <Logo size="lg" />
        </div>

        <div className="relative space-y-10">
          <div className="max-w-md space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-terracotta-200 bg-terracotta-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-terracotta-700">
              <Sparkles className="h-3 w-3" />
              For Restaurant Owners
            </div>
            <h2 className="text-[34px] font-bold leading-[1.1] tracking-tight text-foreground xl:text-[40px]">
              The dashboard built for the people behind the menu.
            </h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Manage every location, photo, review, and menu item from one place.
              Built with AI helpers so you spend less time typing and more time cooking.
            </p>
          </div>

          <ul className="space-y-4 max-w-md">
            {HIGHLIGHTS.map((h) => {
              const Icon = h.icon;
              return (
                <li key={h.title} className="flex gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-terracotta-600 shadow-xs ring-1 ring-border">
                    <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">
                      {h.title}
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      {h.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-[12px] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>Built for restaurants that care about the experience.</span>
        </div>
      </aside>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8 sm:py-14">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex justify-start lg:hidden">
            <Logo size="md" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-[26px] font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-[14px] text-muted-foreground">
              Sign in to your restaurant dashboard.
            </p>
          </div>

          <Suspense>
            <SignInForm />
          </Suspense>

          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            New to SeeIt?{' '}
            <Link
              href="/signup"
              className="font-semibold text-primary hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
