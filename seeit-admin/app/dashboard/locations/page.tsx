import Link from 'next/link';
import { MapPin, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/SearchInput';
import { FilterSelect } from '@/components/FilterSelect';
import { Pagination } from '@/components/Pagination';
import { EmptyState } from '@/components/EmptyState';
import { LocationsList } from './locations-list';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 20;

type SearchParams = {
  q?: string;
  brand?: string;
  city?: string;
  status?: string;
  page?: string;
};

async function fetchLocations(params: SearchParams) {
  const supabase = createClient();
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('locations')
    .select(
      'id, name, address, city, state, cover_photo_url, average_rating, review_count, is_temporarily_closed, brand:brands(id, name, logo_url)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,address.ilike.%${params.q}%`);
  }
  if (params.brand) query = query.eq('brand_id', params.brand);
  if (params.city) query = query.ilike('city', params.city);
  if (params.status === 'closed') query = query.eq('is_temporarily_closed', true);
  if (params.status === 'active') query = query.eq('is_temporarily_closed', false);

  const { data, count, error } = await query;
  return {
    locations: (data ?? []) as any[],
    total: count ?? 0,
    page,
    error: error?.message ?? null,
  };
}

async function fetchBrandOptions() {
  const supabase = createClient();
  const { data } = await supabase
    .from('brands')
    .select('id, name')
    .order('name', { ascending: true })
    .limit(200);
  return (data ?? []) as { id: string; name: string }[];
}

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [data, brands] = await Promise.all([
    fetchLocations(searchParams),
    fetchBrandOptions(),
  ]);

  return (
    <>
      <TopBar
        title="Locations"
        subtitle={`${data.total.toLocaleString()} location${data.total === 1 ? '' : 's'} across all stores`}
      >
        <Button asChild className="gap-1.5">
          <Link href="/dashboard/locations/new">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add location</span>
          </Link>
        </Button>
      </TopBar>
      <div className="flex-1 space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <SearchInput placeholder="Search name or address…" />
          <FilterSelect
            paramName="brand"
            allLabel="All stores"
            placeholder="Store"
            options={brands.map((b) => ({ value: b.id, label: b.name }))}
          />
          <FilterSelect
            paramName="status"
            allLabel="All status"
            placeholder="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'closed', label: 'Temporarily closed' },
            ]}
          />
        </div>

        {data.error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load locations: {data.error}
          </div>
        )}

        {data.locations.length === 0 ? (
          <Card className="overflow-hidden p-0">
            <EmptyState
              icon={MapPin}
              title="No locations found"
              description="Try clearing filters, or click Add location to create one."
            />
          </Card>
        ) : (
          <>
            <LocationsList rows={data.locations} brands={brands} />
            <Pagination page={data.page} pageSize={PAGE_SIZE} total={data.total} />
          </>
        )}
      </div>
    </>
  );
}
