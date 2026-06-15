'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Camera,
  CreditCard,
  Eye,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  QrCode,
  Settings,
  Sparkles,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/Logo';
import { SignOutButton } from '@/components/SignOutButton';
import { BrandBadge } from '@/components/BrandBadge';
import { LocationSwitcher } from '@/components/LocationSwitcher';
import { cn, initials } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
};

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        match: (p) => p === '/dashboard',
      },
      {
        href: '/dashboard/insights',
        label: 'Insights',
        icon: Activity,
        match: (p) => p.startsWith('/dashboard/insights'),
      },
      {
        href: '/dashboard/ai-assistant',
        label: 'AI Assistant',
        icon: Sparkles,
        match: (p) => p.startsWith('/dashboard/ai-assistant'),
      },
    ],
  },
  {
    label: 'Manage',
    items: [
      {
        href: '/dashboard/menu',
        label: 'Menu',
        icon: UtensilsCrossed,
        match: (p) => p.startsWith('/dashboard/menu'),
      },
      {
        href: '/dashboard/photos',
        label: 'Photos',
        icon: Camera,
        match: (p) => p.startsWith('/dashboard/photos'),
      },
      {
        href: '/dashboard/qr-code',
        label: 'QR Code',
        icon: QrCode,
        match: (p) => p.startsWith('/dashboard/qr-code'),
      },
      {
        href: '/dashboard/reviews',
        label: 'Reviews',
        icon: MessageSquare,
        match: (p) => p.startsWith('/dashboard/reviews'),
      },
      {
        href: '/dashboard/locations',
        label: 'Locations',
        icon: MapPin,
        match: (p) => p.startsWith('/dashboard/locations'),
      },
      {
        href: '/dashboard/preview',
        label: 'Storefront',
        icon: Eye,
        match: (p) => p.startsWith('/dashboard/preview'),
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        href: '/dashboard/billing',
        label: 'Billing',
        icon: CreditCard,
        match: (p) => p.startsWith('/dashboard/billing'),
      },
      {
        href: '/dashboard/settings/profile',
        label: 'Settings',
        icon: Settings,
        match: (p) => p.startsWith('/dashboard/settings'),
      },
    ],
  },
];

type Props = {
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
  };
  onLinkClick?: () => void;
};

export function Sidebar({ user, onLinkClick }: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-full flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <Link href="/dashboard" onClick={onLinkClick} className="-m-1 p-1">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={onLinkClick}
          aria-label="Close menu"
          className="-mr-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-warm-100 hover:text-foreground md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Brand badge (one brand per account) + Location switcher */}
      <div className="space-y-2 px-3 pb-3">
        <BrandBadge />
        <LocationSwitcher />
      </div>

      <div className="mx-3 h-px bg-border" />

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="flex flex-col gap-0.5">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onLinkClick}
                  className={cn(
                    'group relative flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all',
                    active
                      ? 'bg-terracotta-50 text-terracotta-700'
                      : 'text-warm-700 hover:bg-warm-50 hover:text-foreground',
                  )}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-terracotta-500"
                    />
                  )}
                  <Icon
                    className={cn(
                      'h-[17px] w-[17px] shrink-0 transition-colors',
                      active
                        ? 'text-terracotta-600'
                        : 'text-warm-500 group-hover:text-warm-700',
                    )}
                    strokeWidth={active ? 2.25 : 2}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-9 w-9 ring-2 ring-card">
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.name ?? user.email} />
            <AvatarFallback className="bg-terracotta-100 text-terracotta-700 text-xs font-semibold">
              {initials(user.name ?? user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
              {user.name ?? user.email}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
