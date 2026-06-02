import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SubscriptionStatusBadge } from '@/components/StatusBadge';
import { FilterSelect } from '@/components/FilterSelect';
import { Pagination } from '@/components/Pagination';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, initials } from '@/lib/utils';
import type { SubscriptionPlan, SubscriptionStatus } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 25;

type SearchParams = { status?: string; plan?: string; page?: string };

async function fetchSubscriptions(params: SearchParams) {
  const supabase = createClient();
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('subscriptions')
    .select(
      'id, plan, status, locations_count, current_period_end, created_at, brand:brands(id, name, logo_url)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.status)
    query = query.eq('status', params.status as SubscriptionStatus);
  if (params.plan) query = query.eq('plan', params.plan as SubscriptionPlan);

  const { data, count, error } = await query;
  return {
    subs: (data ?? []) as any[],
    total: count ?? 0,
    page,
    error: error?.message ?? null,
  };
}

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { subs, total, page, error } = await fetchSubscriptions(searchParams);

  return (
    <>
      <TopBar
        title="Subscriptions"
        subtitle={`${total.toLocaleString()} subscription${total === 1 ? '' : 's'} · read-only (Stripe sync coming later)`}
      />
      <div className="flex-1 space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <div className="rounded-md border border-blue-200 bg-blue-50/60 px-4 py-3 text-sm text-blue-700">
          Full subscription management coming with Stripe integration.
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <FilterSelect
            paramName="status"
            allLabel="All statuses"
            placeholder="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'trialing', label: 'Trialing' },
              { value: 'past_due', label: 'Past due' },
              { value: 'canceled', label: 'Canceled' },
              { value: 'incomplete', label: 'Incomplete' },
              { value: 'unpaid', label: 'Unpaid' },
            ]}
          />
          <FilterSelect
            paramName="plan"
            allLabel="All plans"
            placeholder="Plan"
            options={[
              { value: 'starter', label: 'Starter' },
              { value: 'pro', label: 'Pro' },
              { value: 'premium', label: 'Premium' },
            ]}
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load subscriptions: {error}
          </div>
        )}

        <Card className="overflow-hidden p-0">
          {subs.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No subscriptions"
              description="No subscriptions match the current filter."
            />
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Locations</TableHead>
                      <TableHead>Next billing</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subs.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          {s.brand ? (
                            <Link
                              href={`/dashboard/brands/${s.brand.id}`}
                              className="flex items-center gap-3"
                            >
                              <Avatar className="h-9 w-9 rounded-md">
                                {s.brand.logo_url ? (
                                  <AvatarImage src={s.brand.logo_url} alt={s.brand.name} />
                                ) : null}
                                <AvatarFallback className="rounded-md bg-terracotta-100 text-terracotta-700">
                                  {initials(s.brand.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{s.brand.name}</span>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">Orphaned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="primary" className="capitalize">
                            {s.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <SubscriptionStatusBadge status={s.status} />
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {s.locations_count ?? 0}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(s.current_period_end)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(s.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <ul className="divide-y divide-border md:hidden">
                {subs.map((s) => (
                  <li key={s.id} className="flex items-start gap-3 px-4 py-3.5">
                    <Avatar className="h-10 w-10 shrink-0 rounded-md">
                      {s.brand?.logo_url ? (
                        <AvatarImage src={s.brand.logo_url} />
                      ) : null}
                      <AvatarFallback className="rounded-md bg-terracotta-100 text-terracotta-700">
                        {s.brand ? initials(s.brand.name) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      {s.brand ? (
                        <Link
                          href={`/dashboard/brands/${s.brand.id}`}
                          className="truncate font-semibold hover:underline"
                        >
                          {s.brand.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Orphaned</span>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="primary" className="capitalize">
                          {s.plan}
                        </Badge>
                        <SubscriptionStatusBadge status={s.status} />
                        <span className="text-[11px] text-muted-foreground">
                          {s.locations_count ?? 0} loc · next {formatDate(s.current_period_end)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
            </>
          )}
        </Card>
      </div>
    </>
  );
}
