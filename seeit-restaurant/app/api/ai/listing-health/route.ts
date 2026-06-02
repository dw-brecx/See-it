import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import { AiNotConfigured, analyzeListingHealth } from '@/lib/ai';

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

  // Ownership check: user owns the brand OR is on its team
  const [ownedRes, teamRes] = await Promise.all([
    supabase
      .from('brands')
      .select('id, name, description, tagline, primary_cuisine, secondary_cuisines, story, logo_url, cover_photo_url, storefront_published')
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

  let brand = ownedRes.data;
  if (!brand) {
    if (!teamRes.data) {
      return Response.json({ error: 'forbidden' }, { status: 403 });
    }
    // Fetch brand info as a team member (RLS should allow it)
    const { data } = await supabase
      .from('brands')
      .select(
        'id, name, description, tagline, primary_cuisine, secondary_cuisines, story, logo_url, cover_photo_url, storefront_published',
      )
      .eq('id', brandId)
      .maybeSingle();
    brand = data ?? null;
    if (!brand) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }
  }

  // Gather locations, menu items, recent reviews
  const { data: locations } = await supabase
    .from('locations')
    .select(
      'id, name, address, city, phone, hours, dietary_tags, style_tags, average_rating, review_count, cover_photo_url, description',
    )
    .eq('brand_id', brandId);
  const locationIds = (locations ?? []).map((l) => l.id);

  let menuItems: any[] = [];
  let reviews: any[] = [];
  if (locationIds.length > 0) {
    const [menuRes, reviewsRes] = await Promise.all([
      supabase
        .from('menu_items')
        .select('id, name, description, price, is_visible, photo_count, average_rating')
        .in('location_id', locationIds)
        .limit(60),
      supabase
        .from('reviews')
        .select('rating, text, created_at')
        .in('location_id', locationIds)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    menuItems = menuRes.data ?? [];
    reviews = reviewsRes.data ?? [];
  }

  const brandSummary =
    `Name: ${brand.name}\n` +
    `Tagline: ${brand.tagline ?? '(none)'}\n` +
    `Description: ${brand.description ?? '(none)'}\n` +
    `Story length: ${brand.story?.length ?? 0} chars\n` +
    `Primary cuisine: ${brand.primary_cuisine ?? '(none)'}\n` +
    `Secondary cuisines: ${(brand.secondary_cuisines ?? []).join(', ') || '(none)'}\n` +
    `Logo: ${brand.logo_url ? 'set' : 'missing'}\n` +
    `Cover photo: ${brand.cover_photo_url ? 'set' : 'missing'}\n` +
    `Storefront published: ${brand.storefront_published ? 'yes' : 'no'}`;

  const locationsSummary =
    (locations ?? [])
      .map(
        (l) =>
          `- ${l.name} (${l.city ?? 'unknown city'}): rating ${l.average_rating ?? 'n/a'} from ${l.review_count ?? 0} reviews. ` +
          `Phone: ${l.phone ? 'set' : 'missing'}. ` +
          `Hours: ${l.hours ? 'set' : 'missing'}. ` +
          `Cover photo: ${l.cover_photo_url ? 'set' : 'missing'}. ` +
          `Description: ${l.description ? `${l.description.length} chars` : 'missing'}. ` +
          `Dietary tags: ${(l.dietary_tags ?? []).join(', ') || 'none'}. ` +
          `Style tags: ${(l.style_tags ?? []).join(', ') || 'none'}.`,
      )
      .join('\n') || '(no locations yet)';

  const visibleItems = menuItems.filter((m) => m.is_visible !== false);
  const hiddenItems = menuItems.length - visibleItems.length;
  const itemsMissingDescription = menuItems.filter(
    (m) => !m.description || m.description.length < 12,
  ).length;
  const itemsMissingPhoto = menuItems.filter(
    (m) => !m.photo_count || m.photo_count === 0,
  ).length;
  const menuSummary =
    `${menuItems.length} menu items total (${visibleItems.length} visible, ${hiddenItems} hidden).\n` +
    `Missing description: ${itemsMissingDescription}.\n` +
    `Missing photos: ${itemsMissingPhoto}.\n` +
    `Sample items: ${menuItems
      .slice(0, 10)
      .map((m) => `${m.name}${m.price ? ` ($${m.price})` : ''}`)
      .join(', ') || '(none)'}`;

  const reviewSummary =
    reviews.length === 0
      ? '(no reviews yet)'
      : `${reviews.length} recent reviews. Average rating: ${
          (
            reviews.reduce((s, r: any) => s + Number(r.rating ?? 0), 0) /
            reviews.length
          ).toFixed(2)
        }.\nRecent snippets:\n` +
        reviews
          .slice(0, 10)
          .map((r: any) => `- (${r.rating}/5) ${(r.text ?? '').slice(0, 200)}`)
          .join('\n');

  try {
    const recommendations = await analyzeListingHealth({
      brandSummary,
      locationsSummary,
      menuSummary,
      reviewSummary,
    });
    return Response.json({ recommendations });
  } catch (err) {
    if (err instanceof AiNotConfigured) {
      return Response.json({ configured: false }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : 'unknown';
    return Response.json({ error: message }, { status: 502 });
  }
}
