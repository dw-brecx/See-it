import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import { GoogleNotConfigured, searchBusinesses } from '@/lib/google-places';

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

  let body: { query?: unknown; location?: { lat?: number; lng?: number } } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query) {
    // Empty query → use this as a config probe; if not configured surface 503
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return Response.json({ configured: false }, { status: 503 });
    }
    return Response.json({ results: [] });
  }

  const loc =
    body.location &&
    typeof body.location.lat === 'number' &&
    typeof body.location.lng === 'number'
      ? { lat: body.location.lat, lng: body.location.lng }
      : undefined;

  try {
    const results = await searchBusinesses(query, loc);
    return Response.json({ results });
  } catch (err) {
    if (err instanceof GoogleNotConfigured) {
      return Response.json({ configured: false }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : 'unknown';
    return Response.json({ error: message }, { status: 502 });
  }
}
