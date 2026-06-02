import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import { GoogleNotConfigured, getPlaceDetails } from '@/lib/google-places';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
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

  const placeId = params.id;
  if (!placeId) {
    return Response.json({ error: 'missing_id' }, { status: 400 });
  }

  try {
    const place = await getPlaceDetails(placeId);
    return Response.json({ place });
  } catch (err) {
    if (err instanceof GoogleNotConfigured) {
      return Response.json({ configured: false }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : 'unknown';
    return Response.json({ error: message }, { status: 502 });
  }
}
