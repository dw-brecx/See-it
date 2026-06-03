'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Building2,
  Plug,
  User as UserIcon,
  Users as UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Tab = { href: string; label: string; icon: LucideIcon };

const TABS: Tab[] = [
  { href: '/dashboard/settings/profile', label: 'Store profile', icon: Building2 },
  { href: '/dashboard/settings/account', label: 'Account', icon: UserIcon },
  { href: '/dashboard/settings/team', label: 'Team', icon: UsersIcon },
  { href: '/dashboard/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/settings/integrations', label: 'Integrations', icon: Plug },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = TABS.find((t) => pathname.startsWith(t.href))?.href ?? TABS[0].href;

  return (
    <div className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-4xl">
        {/* Mobile: Select dropdown */}
        <div className="mb-5 sm:hidden">
          <Select
            value={active}
            onValueChange={(val) => router.push(val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TABS.map((t) => (
                <SelectItem key={t.href} value={t.href}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: tab strip */}
        <nav
          aria-label="Settings sections"
          className="mb-6 hidden gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 shadow-xs sm:flex"
        >
          {TABS.map((t) => {
            const isActive = pathname.startsWith(t.href);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-terracotta-50 text-terracotta-700'
                    : 'text-muted-foreground hover:bg-warm-50 hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
