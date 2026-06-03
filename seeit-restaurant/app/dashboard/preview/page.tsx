import Link from 'next/link';
import { ExternalLink, Eye } from 'lucide-react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { StorefrontPreview } from '@/components/StorefrontPreview';
import { CurrentBrandPicker } from './current-brand-picker';

export const dynamic = 'force-dynamic';

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

  const locIds = (locationsRes.data ?? []).map((l: any) => l.id);
  const featuredIds = (brand.featured_menu_item_ids ?? []) as string[];

  // Featured items: fetch the picked ids + their cover photo
  let featuredItems: any[] = [];
  if (featuredIds.length > 0) {
    const { data: items } = await supabase
      .from('menu_items')
      .select(
        'id, name, description, price, dietary_tags, menu_item_photos(photo_url, is_featured, display_order)',
      )
      .in('id', featuredIds);
    const byId = new Map((items ?? []).map((i: any) => [i.id, i]));
    // Preserve the ordering the owner picked
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

  // Recent reviews across all locations
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

async function fetchMyBrands() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('brands')
    .select('id, name, logo_url')
    .eq('owner_id', user.id)
    .order('name', { ascending: true });
  return (data ?? []) as { id: string; name: string; logo_url: string | null }[];
}

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: { brand?: string };
}) {
  const myBrands = await fetchMyBrands();
  if (myBrands.length === 0) redirect('/onboarding');

  const brandId =
    searchParams.brand && myBrands.some((b) => b.id === searchParams.brand)
      ? searchParams.brand
      : myBrands[0].id;

  const data = await fetchStorefront(brandId);

  return (
    <>
      <TopBar
        title="Storefront"
        subtitle="What customers see when they open your storefront"
      >
        <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
          <Link href={`/storefront/${brandId}`} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Open public page</span>
          </Link>
        </Button>
        <Button asChild size="sm" className="h-9 gap-1.5">
          <Link href="/dashboard/settings/profile">
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit storefront</span>
          </Link>
        </Button>
      </TopBar>

      <div className="flex-1 space-y-5 px-4 py-5 sm:px-6 sm:py-6">
        {myBrands.length > 1 && (
          <CurrentBrandPicker brands={myBrands} currentId={brandId} />
        )}

        {!data ? (
          <Card className="overflow-hidden p-0">
            <EmptyState
              icon={Eye}
              title="Storefront not found"
              description="This brand may have been removed."
            />
          </Card>
        ) : (
          <StorefrontPreview
            brand={data.brand}
            locations={data.locations}
            featuredItems={data.featuredItems}
            recentReviews={data.recentReviews}
            isPreview
          />
        )}
      </div>
    </>
  );
}
