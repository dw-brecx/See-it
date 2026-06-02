import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import { AiNotConfigured, generateMenuDescription } from '@/lib/ai';

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

  let body: { itemName?: unknown; details?: unknown; brandVoice?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const itemName = typeof body.itemName === 'string' ? body.itemName.trim() : '';
  const details = typeof body.details === 'string' ? body.details.trim() : '';
  const brandVoice =
    typeof body.brandVoice === 'string' ? body.brandVoice.trim() : undefined;

  if (!itemName) {
    return Response.json({ error: 'missing_itemName' }, { status: 400 });
  }

  try {
    const description = await generateMenuDescription(
      itemName,
      details,
      brandVoice,
    );
    return Response.json({ description });
  } catch (err) {
    if (err instanceof AiNotConfigured) {
      return Response.json({ configured: false }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : 'unknown';
    return Response.json({ error: message }, { status: 502 });
  }
}
