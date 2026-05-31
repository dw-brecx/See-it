import Link from 'next/link';
import { MapPin } from 'lucide-react';
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
import { LocationOpenBadge } from '@/components/StatusBadge';
import { SearchInput } from '@/components/SearchInput';
import { FilterSelect } from '@/components/FilterSelect';
import { Pagination } from '@/components/Pagination';
import { EmptyState } from '@/components/EmptyState';

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
  return (data ?? []).map((b) => ({ value: b.id, label: b.name }));
}

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [data, brandOptions] = await Promise.all([
    fetchLocations(searchParams),
    fetchBrandOptions(),
  ]);

  return (
    <>
      <TopBar
        title="Locations"
        subtitle={`${data.total.toLocaleString()} location${data.total === 1 ? '' : 's'} across all brands`}
      />
      <div className="flex-1 space-y-4 px-6 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput placeholder="Search name or address…" />
          <FilterSelect
            paramName="brand"
            allLabel="All brands"
            placeholder="Brand"
            options={brandOptions}
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

        <Card className="overflow-hidden p-0">
          {data.locations.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No locations found"
              description="Try clearing filters."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Reviews</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.locations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-md">
                            {loc.cover_photo_url ? (
                              <AvatarImage src={loc.cover_photo_url} alt={loc.name} />
                            ) : null}
                            <AvatarFallback className="rounded-md">
                              <MapPin className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium">{loc.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {loc.address}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {loc.brand ? (
                          <Link
                            href={`/dashboard/brands/${loc.brand.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {loc.brand.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {loc.city}
                        {loc.state ? `, ${loc.state}` : ''}
                      </TableCell>
                      <TableCell>
                        <LocationOpenBadge closed={!!loc.is_temporarily_closed} />
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {loc.average_rating != null ? (
                          <span className="inline-flex items-center gap-0.5">
                            <span className="text-amber-600">★</span>
                            {Number(loc.average_rating).toFixed(1)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {loc.review_count ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination page={data.page} pageSize={PAGE_SIZE} total={data.total} />
            </>
          )}
        </Card>
      </div>
    </>
  );
}
