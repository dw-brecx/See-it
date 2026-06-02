'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Star } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useBrand } from '@/components/BrandContext';

type Tone = 'warm' | 'professional' | 'apologetic' | 'grateful';

const TONES: { value: Tone; label: string; hint: string }[] = [
  { value: 'warm', label: 'Warm', hint: 'Friendly + personal' },
  { value: 'professional', label: 'Professional', hint: 'Polished + neutral' },
  { value: 'apologetic', label: 'Apologetic', hint: 'For low ratings' },
  { value: 'grateful', label: 'Grateful', hint: 'For glowing reviews' },
];

export type ReviewForReply = {
  id: string;
  rating: number;
  text: string | null;
  created_at: string | null;
  user: { name: string | null; email: string | null } | null;
};

export type ExistingReply = {
  id: string;
  text: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: ReviewForReply | null;
  existingReply?: ExistingReply | null;
  onSaved?: () => void;
};

/**
 * Reply-to-review dialog. Renders the original review at the top,
 * then a textarea + tone selector + AI suggest button.
 *
 * Save inserts (or updates) a row in `review_replies`. Restaurant
 * owners cannot delete reviews — only reply.
 */
export function ReviewReplyModal({
  open,
  onOpenChange,
  review,
  existingReply,
  onSaved,
}: Props) {
  const router = useRouter();
  const { currentBrandId } = useBrand();
  const [tone, setTone] = React.useState<Tone>('warm');
  const [text, setText] = React.useState('');
  const [aiBusy, setAiBusy] = React.useState(false);
  const [aiUnavailable, setAiUnavailable] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const submittingRef = React.useRef(false);

  // Reset state whenever the dialog opens for a different review.
  React.useEffect(() => {
    if (open) {
      setText(existingReply?.text ?? '');
      setTone('warm');
      setAiUnavailable(false);
    }
  }, [open, review?.id, existingReply?.id, existingReply?.text]);

  async function suggestWithAi() {
    if (!review) return;
    setAiBusy(true);
    try {
      const res = await fetch('/api/ai/review-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: review.text ?? '',
          rating: review.rating,
          tone,
          reviewerName: review.user?.name ?? null,
        }),
      });
      if (res.status === 503) {
        setAiUnavailable(true);
        toast.error('AI not configured. Connect Anthropic in Settings → Integrations.');
        return;
      }
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        toast.error(`AI failed: ${msg || res.statusText}`);
        return;
      }
      const data = (await res.json()) as { reply?: string };
      if (data.reply) setText(data.reply);
      else toast.warning('AI returned an empty reply — try again.');
    } catch (err: any) {
      toast.error(`AI failed: ${err?.message ?? 'network error'}`);
    } finally {
      setAiBusy(false);
    }
  }

  async function save() {
    if (submittingRef.current) return;
    if (!review || !currentBrandId) return;
    if (!text.trim()) {
      toast.warning('Write a reply first.');
      return;
    }
    submittingRef.current = true;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not signed in.');
        return;
      }

      if (existingReply) {
        const { error } = await supabase
          .from('review_replies')
          .update({ text: text.trim() })
          .eq('id', existingReply.id);
        if (error) {
          toast.error(`Save failed: ${error.message}`);
          return;
        }
        toast.success('Reply updated.');
      } else {
        const { error } = await supabase.from('review_replies').insert({
          review_id: review.id,
          brand_id: currentBrandId,
          replier_user_id: user.id,
          text: text.trim(),
        });
        if (error) {
          toast.error(`Reply failed: ${error.message}`);
          return;
        }
        toast.success('Reply posted.');
      }
      onOpenChange(false);
      onSaved?.();
      router.refresh();
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  if (!review) return null;

  const reviewerLabel =
    review.user?.name ?? review.user?.email ?? 'Anonymous diner';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {existingReply ? 'Edit your reply' : 'Reply to review'}
          </DialogTitle>
          <DialogDescription>
            Your reply appears publicly under the original review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original review (read-only) */}
          <div className="rounded-lg border border-warm-200 bg-warm-50/60 p-3">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold">{reviewerLabel}</span>
              <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
                <Star className="h-3 w-3 fill-current" />
                <span className="text-[11.5px] font-semibold tabular-nums">
                  {review.rating}
                </span>
              </span>
            </div>
            {review.text ? (
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                "{review.text}"
              </p>
            ) : (
              <p className="mt-1.5 text-[13px] italic text-muted-foreground">
                (no written feedback)
              </p>
            )}
          </div>

          {/* Tone selector */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              AI tone
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={cn(
                    'inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors',
                    tone === t.value
                      ? 'border-terracotta-300 bg-terracotta-50 text-terracotta-700'
                      : 'border-border bg-card text-muted-foreground hover:border-warm-300 hover:text-foreground',
                  )}
                  title={t.hint}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <span title={aiUnavailable ? 'Connect Anthropic in Settings → Integrations' : undefined}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={suggestWithAi}
              disabled={aiBusy || aiUnavailable}
              className="gap-1.5"
            >
              {aiBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              )}
              Suggest with AI
            </Button>
          </span>

          {/* Reply textarea */}
          <div className="space-y-1.5">
            <Label htmlFor="reply-text" className="text-xs uppercase tracking-wider text-muted-foreground">
              Your reply
            </Label>
            <Textarea
              id="reply-text"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Thanks for stopping by — we appreciate the feedback…"
            />
          </div>

          {/* Tips panel */}
          <div className="rounded-md border border-blue-100 bg-blue-50/60 p-2.5 text-[12px] text-blue-900">
            <p className="font-semibold">Tips</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-blue-800/90">
              <li>Thank them by name when you can.</li>
              <li>Address the specific concern — don't argue or get defensive.</li>
              <li>Reply within 24 hours for the biggest impact.</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={saving || !text.trim()}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : existingReply ? (
              'Update reply'
            ) : (
              'Post reply'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
