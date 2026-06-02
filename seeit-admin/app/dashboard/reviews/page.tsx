import { MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/card';
import { FilterSelect } from '@/components/FilterSelect';
import { Pagination } from '@/components/Pagination';
import { EmptyState } from '@/components/EmptyState';
import { AddReviewButton } from '@/components/AddReviewButton';
import { ReviewsList } from './reviews-list';

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
      'id, rating, text, is_flagged, created_at, portion_size, worth_the_price, mood_tags, user:users(id, name, email, avatar_url), location:locations(id, name, brand:brands(id, name)), menu_item:menu_items(id, name), review_photos(id, photo_url), review_replies(id, text, created_at)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.filter === 'flagged') query = query.eq('is_flagged', true);
  if (params.filter === 'low') query = query.lte('rating', 2);

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

  return (
    <>
      <TopBar
        title="Reviews"
        subtitle={`${total.toLocaleString()} review${total === 1 ? '' : 's'} across the platform`}
      >
        <AddReviewButton />
      </TopBar>
      <div className="flex-1 space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            paramName="filter"
            allLabel="All reviews"
            placeholder="Filter"
            options={[
              { value: 'flagged', label: 'Flagged only' },
              { value: 'low', label: 'Low rated (1–2 stars)' },
              { value: 'unreplied', label: 'Awaiting reply' },
            ]}
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load reviews: {error}
          </div>
        )}

        {reviews.length === 0 ? (
          <Card className="overflow-hidden p-0">
            <EmptyState
              icon={MessageSquare}
              title="No reviews"
              description="Nothing matches the current filter."
            />
          </Card>
        ) : (
          <>
            <ReviewsList rows={reviews} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
          </>
        )}
      </div>
    </>
  );
}
