import { MessageSquare } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FilterSelect } from '@/components/FilterSelect';
import { Pagination } from '@/components/Pagination';
import { EmptyState } from '@/components/EmptyState';
import { ReviewModal } from './review-actions';
import { formatRelative, initials, truncate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 25;

type SearchParams = { filter?: string; page?: string; open?: string };

async function fetchReviews(params: SearchParams) {
  const supabase = createClient();
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('reviews')
    .select(
      'id, rating, text, is_flagged, created_at, portion_size, worth_it, mood_tags, user:users(id, name, email, avatar_url), location:locations(id, name, brand:brands(id, name)), menu_item:menu_items(id, name), review_photos(id, url), review_replies(id, text, created_at)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.filter === 'flagged') query = query.eq('is_flagged', true);
  if (params.filter === 'low') query = query.lte('rating', 2);
  if (params.filter === 'unreplied') {
    // can't easily express "no replies" in postgrest filter without RPC.
    // We'll filter client-side after fetch for unreplied. Keep server query simple.
  }

  const { data, count, error } = await query;
  let reviews = (data ?? []) as any[];
  if (params.filter === 'unreplied') {
    reviews = reviews.filter((r) => !r.review_replies?.length);
  }
  return {
    reviews,
    total: count ?? 0,
    page,
    error: error?.message ?? null,
  };
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { reviews, total, page, error } = await fetchReviews(searchParams);
  const activeReview = searchParams.open
    ? reviews.find((r) => r.id === searchParams.open)
    : null;

  return (
    <>
      <TopBar
        title="Reviews"
        subtitle={`${total.toLocaleString()} review${total === 1 ? '' : 's'} across the platform`}
      />
      <div className="flex-1 space-y-4 px-6 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            paramName="filter"
            allLabel="All reviews"
            placeholder="Filter"
            options={[
              { value: 'flagged', label: 'Flagged only' },
              { value: 'low', label: 'Low rated (1–2 ★)' },
              { value: 'unreplied', label: 'Awaiting reply' },
            ]}
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load reviews: {error}
          </div>
        )}

        <Card className="overflow-hidden p-0">
          {reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No reviews"
              description="Nothing matches the current filter."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Dish / Location</TableHead>
                    <TableHead>Text</TableHead>
                    <TableHead>Photos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((r) => (
                    <ReviewModal key={r.id} review={r}>
                      <TableRow className="cursor-pointer">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={r.user?.avatar_url ?? undefined} />
                              <AvatarFallback>
                                {initials(r.user?.name ?? r.user?.email ?? '?')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {r.user?.name ?? r.user?.email ?? 'Anon'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-amber-600">
                          ★ {r.rating}
                        </TableCell>
                        <TableCell className="text-sm">
                          <p className="font-medium">{r.menu_item?.name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.location?.name ?? 'Unknown'}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[300px] text-sm text-muted-foreground">
                          {truncate(r.text, 90)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {r.review_photos?.length ?? 0}
                        </TableCell>
                        <TableCell>
                          {r.is_flagged ? (
                            <Badge variant="destructive">Flagged</Badge>
                          ) : r.rating <= 2 ? (
                            <Badge variant="warning">Low rating</Badge>
                          ) : (
                            <Badge variant="success">OK</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatRelative(r.created_at)}
                        </TableCell>
                      </TableRow>
                    </ReviewModal>
                  ))}
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
