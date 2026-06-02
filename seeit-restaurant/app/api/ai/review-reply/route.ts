import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import { AiNotConfigured, suggestReviewReply } from '@/lib/ai';

export const dynamic = 'force-dynamic';

type Tone = 'warm' | 'professional' | 'apologetic' | 'grateful';
const TONES: Tone[] = ['warm', 'professional', 'apologetic', 'grateful'];

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          /* readonly in route */
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let body: {
    reviewText?: unknown;
    rating?: unknown;
    tone?: unknown;
    reviewerName?: unknown;
  } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const reviewText =
    typeof body.reviewText === 'string' ? body.reviewText.trim() : '';
  const ratingRaw = body.rating;
  const rating =
    typeof ratingRaw === 'number'
      ? ratingRaw
      : typeof ratingRaw === 'string'
        ? Number(ratingRaw)
        : NaN;
  const toneRaw = typeof body.tone === 'string' ? body.tone : 'warm';
  const tone: Tone = (TONES as string[]).includes(toneRaw) ? (toneRaw as Tone) : 'warm';
  const reviewerName =
    typeof body.reviewerName === 'string' ? body.reviewerName.trim() : undefined;

  if (!reviewText) {
    return Response.json({ error: 'missing_reviewText' }, { status: 400 });
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return Response.json({ error: 'invalid_rating' }, { status: 400 });
  }

  try {
    const reply = await suggestReviewReply(reviewText, rating, tone, reviewerName);
    return Response.json({ reply });
  } catch (err) {
    if (err instanceof AiNotConfigured) {
      return Response.json({ configured: false }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : 'unknown';
    return Response.json({ error: message }, { status: 502 });
  }
}
