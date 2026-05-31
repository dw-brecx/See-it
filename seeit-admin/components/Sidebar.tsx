'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  MessageSquare,
  CreditCard,
  Activity,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/Logo';
import { SignOutButton } from '@/components/SignOutButton';
import { cn, initials } from '@/lib/utils';

const NAV: { href: string; label: string; icon: LucideIcon; match: (path: string) => boolean }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, match: (p) => p === '/dashboard' },
  { href: '/dashboard/brands', label: 'Brands', icon: Building2, match: (p) => p.startsWith('/dashboard/brands') },
  { href: '/dashboard/locations', label: 'Locations', icon: MapPin, match: (p) => p.startsWith('/dashboard/locations') },
  { href: '/dashboard/users', label: 'Users', icon: Users, match: (p) => p.startsWith('/dashboard/users') },
  { href: '/dashboard/reviews', label: 'Reviews', icon: MessageSquare, match: (p) => p.startsWith('/dashboard/reviews') },
  { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: CreditCard, match: (p) => p.startsWith('/dashboard/subscriptions') },
  { href: '/dashboard/activity', label: 'Activity', icon: Activity, match: (p) => p.startsWith('/dashboard/activity') },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, match: (p) => p.startsWith('/dashboard/settings') },
];

type Props = {
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
  };
};

export function Sidebar({ user }: Props) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r border-border bg-card px-4 py-5">
      <Link href="/dashboard" className="px-2 pb-5">
        <Logo />
      </Link>

      <div className="mb-3 flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatar_url ?? undefined} alt={user.name ?? user.email} />
          <AvatarFallback>{initials(user.name ?? user.email)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight">
            {user.name ?? user.email}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">Admin</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-terracotta-100 text-terracotta-700'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0',
                  active ? 'text-terracotta-500' : 'text-muted-foreground/80',
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border pt-3">
        <SignOutButton />
      </div>
    </aside>
  );
}
