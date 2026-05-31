'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import { formatRelative, initials } from '@/lib/utils';

type Review = {
  id: string;
  rating: number;
  text: string | null;
  is_flagged: boolean;
  created_at: string;
  portion_size: string | null;
  worth_it: boolean | null;
  mood_tags: string[] | null;
  user: { id: string; name: string | null; email: string; avatar_url: string | null } | null;
  location: { id: string; name: string } | null;
  menu_item: { id: string; name: string } | null;
  review_photos: { id: string; url: string }[];
  review_replies: { id: string; text: string; created_at: string }[];
};

type Props = {
  review: Review;
  children: React.ReactNode;
};

export function ReviewModal({ review, children }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState(false);

  async function toggleFlag() {
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('reviews')
      .update({ is_flagged: !review.is_flagged })
      .eq('id', review.id);
    setPending(false);

    if (error) {
      toast.error(`Could not update review: ${error.message}`);
      return;
    }
    toast.success(review.is_flagged ? 'Review unflagged' : 'Review flagged');
    router.refresh();
  }

  async function deleteReview() {
    const supabase = createClient();
    const { error } = await supabase.from('reviews').delete().eq('id', review.id);
    if (error) {
      toast.error(`Could not delete review: ${error.message}`);
      return;
    }
    toast.success('Review deleted');
    setOpen(false);
    router.refresh();
  }

  const reply = review.review_replies?.[0];

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Review</DialogTitle>
            <DialogDescription>
              {review.menu_item?.name ?? '—'} at {review.location?.name ?? 'Unknown'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={review.user?.avatar_url ?? undefined} />
                <AvatarFallback>
                  {initials(review.user?.name ?? review.user?.email ?? '?')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {review.user?.name ?? review.user?.email ?? 'Anon'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {review.user?.email ?? ''} · {formatRelative(review.created_at)}
                </p>
              </div>
              <span className="font-semibold text-amber-600">★ {review.rating}</span>
            </div>

            {review.text && (
              <p className="rounded-md bg-muted/50 px-3 py-2.5 text-sm leading-relaxed">
                "{review.text}"
              </p>
            )}

            {review.review_photos?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {review.review_photos.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.id}
                    src={p.url}
                    alt=""
                    className="aspect-square w-full rounded-md object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 text-xs">
              {review.is_flagged && <Badge variant="destructive">Flagged</Badge>}
              {review.portion_size && (
                <Badge variant="default">Portion: {review.portion_size}</Badge>
              )}
              {review.worth_it != null && (
                <Badge variant={review.worth_it ? 'success' : 'warning'}>
                  {review.worth_it ? 'Worth it' : 'Overpriced'}
                </Badge>
              )}
              {review.mood_tags?.map((t) => (
                <Badge key={t} variant="default">
                  {t}
                </Badge>
              ))}
            </div>

            {reply && (
              <div className="rounded-md border-l-4 border-primary bg-terracotta-50 px-3 py-2.5">
                <p className="text-xs font-semibold text-terracotta-700">
                  Restaurant replied · {formatRelative(reply.created_at)}
                </p>
                <p className="mt-1 text-sm">{reply.text}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={toggleFlag}
              disabled={pending}
              className="gap-1.5"
            >
              <Flag className="h-3.5 w-3.5" />
              {review.is_flagged ? 'Unflag' : 'Flag'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this review?"
        description="The review and its photos will be permanently removed. This cannot be undone."
        confirmLabel="Delete review"
        destructive
        onConfirm={deleteReview}
      />
    </>
  );
}
