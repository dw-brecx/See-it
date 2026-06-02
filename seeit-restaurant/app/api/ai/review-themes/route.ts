import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import { AiNotConfigured, summarizeReviewThemes } from '@/lib/ai';

export const dynamic = 'force-dynamic';

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

  let body: { brandId?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }
  const brandId = typeof body.brandId === 'string' ? body.brandId : '';
  if (!brandId) {
    return Response.json({ error: 'missing_brandId' }, { status: 400 });
  }

  // Ownership check
  const [ownedRes, teamRes] = await Promise.all([
    supabase
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .eq('owner_id', user.id)
      .maybeSingle(),
    supabase
      .from('team_members')
      .select('id')
      .eq('brand_id', brandId)
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);
  if (!ownedRes.data && !teamRes.data) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  // Pull last 30 review snippets across all locations of this brand
  const { data: locations } = await supabase
    .from('locations')
    .select('id')
    .eq('brand_id', brandId);
  const locationIds = (locations ?? []).map((l) => l.id);

  let snippets: string[] = [];
  if (locationIds.length > 0) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating, text, created_at')
      .in('location_id', locationIds)
      .order('created_at', { ascending: false })
      .limit(30);
    snippets = (reviews ?? [])
      .filter((r: any) => typeof r.text === 'string' && r.text.trim().length > 0)
      .map((r: any) => `(${r.rating}/5) ${(r.text ?? '').trim().slice(0, 300)}`);
  }

  try {
    const themes = await summarizeReviewThemes(snippets);
    return Response.json({ themes });
  } catch (err) {
    if (err instanceof AiNotConfigured) {
      return Response.json({ configured: false }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : 'unknown';
    return Response.json({ error: message }, { status: 502 });
  }
}
