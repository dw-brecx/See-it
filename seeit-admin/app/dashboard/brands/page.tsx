import Link from 'next/link';
import { Building2 } from 'lucide-react';
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
import { SubscriptionStatusBadge, SuspendedBadge } from '@/components/StatusBadge';
import { SearchInput } from '@/components/SearchInput';
import { FilterSelect } from '@/components/FilterSelect';
import { Pagination } from '@/components/Pagination';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 20;

type SearchParams = {
  q?: string;
  status?: string;
  suspended?: string;
  page?: string;
};

async function fetchBrands(params: SearchParams) {
  const supabase = createClient();
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('brands')
    .select(
      'id, name, logo_url, primary_cuisine, subscription_status, is_suspended, created_at, owner:users!brands_owner_id_fkey(id, email, name), locations(count)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.q) {
    query = query.or(
      `name.ilike.%${params.q}%,primary_cuisine.ilike.%${params.q}%`,
    );
  }
  if (params.status) query = query.eq('subscription_status', params.status);
  if (params.suspended === 'true') query = query.eq('is_suspended', true);
  if (params.suspended === 'false') query = query.eq('is_suspended', false);

  const { data, count, error } = await query;
  return {
    brands: (data ?? []) as any[],
    total: count ?? 0,
    page,
    error: error?.message ?? null,
  };
}

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { brands, total, page, error } = await fetchBrands(searchParams);

  return (
    <>
      <TopBar
        title="Brands"
        subtitle={`${total.toLocaleString()} brand${total === 1 ? '' : 's'} on the platform`}
      />
      <div className="flex-1 space-y-4 px-6 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput placeholder="Search brand or cuisine…" />
          <FilterSelect
            paramName="status"
            allLabel="All subscriptions"
            placeholder="Subscription"
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
            paramName="suspended"
            allLabel="All brands"
            placeholder="Suspension"
            options={[
              { value: 'true', label: 'Suspended only' },
              { value: 'false', label: 'Not suspended' },
            ]}
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load brands: {error}
          </div>
        )}

        <Card className="overflow-hidden p-0">
          {brands.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No brands found"
              description="Try clearing filters or check back later."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Cuisine</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((brand) => {
                    const locCount =
                      Array.isArray(brand.locations) && brand.locations[0]
                        ? brand.locations[0].count
                        : 0;
                    return (
                      <TableRow key={brand.id} className="cursor-pointer">
                        <TableCell>
                          <Link
                            href={`/dashboard/brands/${brand.id}`}
                            className="flex items-center gap-3"
                          >
                            <Avatar className="h-9 w-9 rounded-md">
                              {brand.logo_url ? (
                                <AvatarImage
                                  src={brand.logo_url}
                                  alt={brand.name}
                                />
                              ) : null}
                              <AvatarFallback className="rounded-md bg-terracotta-100 text-terracotta-700">
                                {initials(brand.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{brand.name}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {brand.primary_cuisine ?? '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {brand.owner?.email ?? (
                            <span className="text-muted-foreground">Orphaned</span>
                          )}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {locCount}
                        </TableCell>
                        <TableCell>
                          <SubscriptionStatusBadge
                            status={brand.subscription_status}
                          />
                        </TableCell>
                        <TableCell>
                          <SuspendedBadge suspended={!!brand.is_suspended} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(brand.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
            </>
          )}
        </Card>
      </div>
    </>
  );
}
