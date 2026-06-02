'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Info,
  Lock,
  MessageSquare,
  Pencil,
  Star,
  UtensilsCrossed,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';
import {
  ReviewReplyModal,
  type ExistingReply,
  type ReviewForReply,
} from '@/components/ReviewReplyModal';
import { ALL_LOCATIONS, useBrand } from '@/components/BrandContext';
import { createClient } from '@/lib/supabase/client';
import { formatRelative, initials } from '@/lib/utils';
import { cn } from '@/lib/utils';

type ReplyRow = {
  id: string;
  text: string;
  created_at: string | null;
  updated_at: string | null;
};

type ReviewRow = {
  id: string;
  rating: number;
  text: string | null;
  is_flagged: boolean | null;
  created_at: string | null;
  menu_item_id: string | null;
  location_id: string;
  user: { id: string; name: string | null; email: string | null; avatar_url: string | null } | null;
  location: { id: string; name: string } | null;
  menu_item: { id: string; name: string } | null;
  review_photos: { id: string; photo_url: string; display_order: number | null }[];
  review_replies: ReplyRow[];
};

type RatingFilter = 'all' | '1' | '2' | '3' | '4' | '5';
type ReplyFilter = 'all' | 'replied' | 'unreplied';
type TypeFilter = 'all' | 'overall' | 'dish';

export function ReviewsList() {
  const { currentBrandId, currentLocationId, brandLocations } = useBrand();
  const [rows, setRows] = React.useState<ReviewRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [rating, setRating] = React.useState<RatingFilter>('all');
  const [reply, setReply] = React.useState<ReplyFilter>('all');
  const [type, setType] = React.useState<TypeFilter>('all');
  const [locationFilter, setLocationFilter] = React.useState<string>('all');

  const [replyModalFor, setReplyModalFor] = React.useState<{
    review: ReviewForReply;
    existing: ExistingReply | null;
  } | null>(null);

  const locationIds = React.useMemo(() => {
    if (currentLocationId === ALL_LOCATIONS) {
      return brandLocations.map((l) => l.id);
    }
    return [currentLocationId];
  }, [currentLocationId, brandLocations]);

  const loadKey = locationIds.join(',');

  const refresh = React.useCallback(async () => {
    if (!currentBrandId || locationIds.length === 0) {
      setRows([]);
      return;
    }
    setRows(null);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reviews')
      .select(
        'id, rating, text, is_flagged, created_at, menu_item_id, location_id, user:users(id, name, email, avatar_url), location:locations(id, name), menu_item:menu_items(id, name), review_photos(id, photo_url, display_order), review_replies(id, text, created_at, updated_at)',
      )
      .in('location_id', locationIds)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      setError(error.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as any);
  }, [currentBrandId, loadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = React.useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      if (rating !== 'all' && r.rating !== Number(rating)) return false;
      const hasReply = (r.review_replies?.length ?? 0) > 0;
      if (reply === 'replied' && !hasReply) return false;
      if (reply === 'unreplied' && hasReply) return false;
      if (type === 'overall' && r.menu_item_id !== null) return false;
      if (type === 'dish' && r.menu_item_id === null) return false;
      if (
        currentLocationId === ALL_LOCATIONS &&
        locationFilter !== 'all' &&
        r.location_id !== locationFilter
      )
        return false;
      return true;
    });
  }, [rows, rating, reply, type, locationFilter, currentLocationId]);

  if (rows === null) {
    return (
      <div className="space-y-3">
        <FilterBarSkeleton />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Read-only banner */}
      <div className="flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50/70 px-3 py-2.5 text-[12.5px] text-blue-900">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Reviews can't be deleted — reply to address concerns. Most diners
          appreciate a thoughtful response, even on tough feedback.
        </span>
      </div>

      {/* Filters */}
      <Card className="flex flex-wrap items-center gap-2 border-warm-200 bg-card/80 px-3 py-2.5">
        <FilterGroup
          label="Rating"
          value={rating}
          onChange={(v) => setRating(v as RatingFilter)}
          options={[
            { value: 'all', label: 'All' },
            { value: '5', label: '5★' },
            { value: '4', label: '4★' },
            { value: '3', label: '3★' },
            { value: '2', label: '2★' },
            { value: '1', label: '1★' },
          ]}
        />
        <span className="hidden h-5 w-px bg-warm-200 sm:inline-block" />
        <FilterGroup
          label="Status"
          value={reply}
          onChange={(v) => setReply(v as ReplyFilter)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'unreplied', label: 'Awaiting reply' },
            { value: 'replied', label: 'Replied' },
          ]}
        />
        <span className="hidden h-5 w-px bg-warm-200 sm:inline-block" />
        <FilterGroup
          label="Type"
          value={type}
          onChange={(v) => setType(v as TypeFilter)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'overall', label: 'Overall' },
            { value: 'dish', label: 'Dish' },
          ]}
        />
        {currentLocationId === ALL_LOCATIONS && brandLocations.length > 1 && (
          <>
            <span className="hidden h-5 w-px bg-warm-200 sm:inline-block" />
            <FilterGroup
              label="Location"
              value={locationFilter}
              onChange={setLocationFilter}
              options={[
                { value: 'all', label: 'All' },
                ...brandLocations.map((l) => ({ value: l.id, label: l.name })),
              ]}
            />
          </>
        )}
      </Card>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load reviews: {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="overflow-hidden p-0">
          <EmptyState
            icon={MessageSquare}
            title={rows.length === 0 ? 'No reviews yet' : 'No reviews match these filters'}
            description={
              rows.length === 0
                ? 'As customers post reviews, they\'ll show up here.'
                : 'Try clearing a filter to see more results.'
            }
          />
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <ReviewCard
              key={r.id}
              row={r}
              showLocation={currentLocationId === ALL_LOCATIONS}
              onReply={() =>
                setReplyModalFor({
                  review: {
                    id: r.id,
                    rating: r.rating,
                    text: r.text,
                    created_at: r.created_at,
                    user: r.user
                      ? { name: r.user.name, email: r.user.email }
                      : null,
                  },
                  existing: r.review_replies?.[0]
                    ? {
                        id: r.review_replies[0].id,
                        text: r.review_replies[0].text,
                      }
                    : null,
                })
              }
            />
          ))}
        </ul>
      )}

      <ReviewReplyModal
        open={!!replyModalFor}
        onOpenChange={(o) => !o && setReplyModalFor(null)}
        review={replyModalFor?.review ?? null}
        existingReply={replyModalFor?.existing ?? null}
        onSaved={refresh}
      />
    </div>
  );
}

function FilterBarSkeleton() {
  return (
    <Card className="flex flex-wrap items-center gap-2 px-3 py-2.5">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-7 w-32" />
    </Card>
  );
}

function FilterGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex min-h-8 items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium transition-colors',
              value === o.value
                ? 'border-terracotta-300 bg-terracotta-50 text-terracotta-700'
                : 'border-border bg-card text-muted-foreground hover:border-warm-300 hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewCard({
  row,
  showLocation,
  onReply,
}: {
  row: ReviewRow;
  showLocation: boolean;
  onReply: () => void;
}) {
  const reply = row.review_replies?.[0];
  const reviewerLabel =
    row.user?.name ?? row.user?.email ?? 'Anonymous diner';
  const photos = (row.review_photos ?? []).slice().sort((a, b) => {
    return (a.display_order ?? 0) - (b.display_order ?? 0);
  });

  return (
    <li>
      <Card className="space-y-3 p-4 sm:p-5">
        {/* Header: avatar, name, rating, time */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={row.user?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-terracotta-50 text-terracotta-700 text-[11px] font-semibold">
              {initials(reviewerLabel)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[14px] font-semibold">{reviewerLabel}</span>
              <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
                <Star className="h-3 w-3 fill-current" />
                <span className="text-[11.5px] font-semibold tabular-nums">
                  {row.rating}
                </span>
              </span>
              {row.is_flagged && <Badge variant="destructive">Flagged</Badge>}
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-muted-foreground">
              <span>{formatRelative(row.created_at)}</span>
              {row.menu_item ? (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <UtensilsCrossed className="h-3 w-3" />
                    {row.menu_item.name}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span>Overall review</span>
                </>
              )}
              {showLocation && row.location && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span>{row.location.name}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Review text */}
        {row.text && (
          <p className="whitespace-pre-line text-[14px] leading-relaxed text-foreground">
            {row.text}
          </p>
        )}

        {/* Review photos */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {photos.map((p) => (
              <a
                key={p.id}
                href={p.photo_url}
                target="_blank"
                rel="noreferrer"
                className="relative aspect-square overflow-hidden rounded-md border border-border bg-warm-50"
              >
                <Image
                  src={p.photo_url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                />
              </a>
            ))}
          </div>
        )}

        {/* Reply block — either rendered reply or big reply CTA */}
        {reply ? (
          <div className="rounded-lg border-l-4 border-terracotta-400 bg-terracotta-50/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-terracotta-700">
                Your reply
                <span className="ml-1.5 font-normal normal-case tracking-normal text-terracotta-700/70">
                  {formatRelative(reply.updated_at ?? reply.created_at)}
                </span>
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onReply}
                className="h-7 gap-1 px-2 text-[11.5px]"
              >
                <Pencil className="h-3 w-3" /> Edit
              </Button>
            </div>
            <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-foreground">
              {reply.text}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-warm-300 bg-warm-50/40 p-3">
            <p className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              No reply yet — diners notice when owners respond.
            </p>
            <Button
              type="button"
              onClick={onReply}
              size="sm"
              className="h-9 gap-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5" /> Reply
            </Button>
          </div>
        )}
      </Card>
    </li>
  );
}
