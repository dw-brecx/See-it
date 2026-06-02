import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StorefrontPreview } from '@/components/StorefrontPreview';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchStorefront(brandId: string) {
  const supabase = createClient();

  const [brandRes, locationsRes] = await Promise.all([
    supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .maybeSingle(),
    supabase
      .from('locations')
      .select(
        'id, name, address, city, state, phone, cover_photo_url, dietary_tags, average_rating, review_count, is_temporarily_closed, hours',
      )
      .eq('brand_id', brandId)
      .order('name', { ascending: true }),
  ]);

  const brand = brandRes.data as any;
  if (!brand) return null;

  // Public route — only show if the owner has actually published
  if (brand.storefront_published === false) return null;
  if (brand.is_suspended) return null;

  const locIds = (locationsRes.data ?? []).map((l: any) => l.id);
  const featuredIds = (brand.featured_menu_item_ids ?? []) as string[];

  let featuredItems: any[] = [];
  if (featuredIds.length > 0) {
    const { data: items } = await supabase
      .from('menu_items')
      .select(
        'id, name, description, price, dietary_tags, menu_item_photos(photo_url, is_featured, display_order)',
      )
      .in('id', featuredIds);
    const byId = new Map((items ?? []).map((i: any) => [i.id, i]));
    featuredItems = featuredIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((i: any) => {
        const photos = (i.menu_item_photos ?? []) as any[];
        const cover = photos.find((p) => p.is_featured) ?? photos[0];
        return {
          id: i.id,
          name: i.name,
          description: i.description,
          price: i.price,
          dietary_tags: i.dietary_tags,
          photo_url: cover?.photo_url ?? null,
        };
      });
  }

  let recentReviews: any[] = [];
  if (locIds.length > 0) {
    const { data: revs } = await supabase
      .from('reviews')
      .select(
        'id, rating, text, created_at, user:users(name, email, avatar_url), location:locations(name)',
      )
      .in('location_id', locIds)
      .order('created_at', { ascending: false })
      .limit(5);
    recentReviews = (revs ?? []).map((r: any) => ({
      id: r.id,
      rating: r.rating,
      text: r.text,
      created_at: r.created_at,
      reviewer_name: r.user?.name ?? r.user?.email ?? 'Anonymous',
      reviewer_avatar_url: r.user?.avatar_url ?? null,
      location_name: r.location?.name ?? null,
    }));
  }

  return {
    brand,
    locations: (locationsRes.data ?? []) as any[],
    featuredItems,
    recentReviews,
  };
}

export async function generateMetadata({
  params,
}: {
  params: { brandId: string };
}) {
  const data = await fetchStorefront(params.brandId);
  if (!data) return { title: 'Storefront — SeeIt' };
  return {
    title: `${data.brand.name} — SeeIt`,
    description:
      data.brand.tagline ??
      data.brand.description ??
      `${data.brand.name} on SeeIt`,
  };
}

export default async function PublicStorefrontPage({
  params,
}: {
  params: { brandId: string };
}) {
  const data = await fetchStorefront(params.brandId);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-warm-50 py-6 sm:py-10">
      <StorefrontPreview
        brand={data.brand}
        locations={data.locations}
        featuredItems={data.featuredItems}
        recentReviews={data.recentReviews}
      />
    </main>
  );
}
