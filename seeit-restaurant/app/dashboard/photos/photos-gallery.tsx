'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  CheckCircle2,
  Info,
  MapPin,
  Star,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PhotoUploader } from '@/components/PhotoUploader';
import { ALL_LOCATIONS, useBrand } from '@/components/BrandContext';
import { STORAGE } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { formatRelative, initials } from '@/lib/utils';

type PhotoRow = {
  id: string;
  photo_url: string;
  is_featured: boolean | null;
  is_restaurant_uploaded: boolean | null;
  created_at: string | null;
  menu_item_id: string;
  user_id: string | null;
  menu_item?: { id: string; name: string };
  user?: { id: string; name: string | null; email: string; avatar_url: string | null };
};

type MenuItemLite = { id: string; name: string };

type Tab = 'all' | 'restaurant' | 'customer';

export function PhotosGallery() {
  const router = useRouter();
  const { currentBrandId, currentLocationId, currentLocation } = useBrand();
  const isAll = currentLocationId === ALL_LOCATIONS;
  const locationId = isAll ? null : currentLocationId;

  const [tab, setTab] = React.useState<Tab>('all');
  const [menuItems, setMenuItems] = React.useState<MenuItemLite[]>([]);
  const [filterItemId, setFilterItemId] = React.useState<string>('all');
  const [photos, setPhotos] = React.useState<PhotoRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [delPhoto, setDelPhoto] = React.useState<PhotoRow | null>(null);

  // Upload picker — which dish to tag the new photos to
  const [uploadTarget, setUploadTarget] = React.useState<string>('');

  const fetchPhotos = React.useCallback(async () => {
    if (!locationId) return;
    setLoading(true);
    const supabase = createClient();

    // Pull menu items for this location so we can filter + tag uploads
    const { data: items } = await supabase
      .from('menu_items')
      .select('id, name')
      .eq('location_id', locationId)
      .order('name');
    setMenuItems((items ?? []) as MenuItemLite[]);

    const itemIds = (items ?? []).map((i) => i.id);
    if (itemIds.length === 0) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('menu_item_photos')
      .select(
        'id, photo_url, is_featured, is_restaurant_uploaded, created_at, menu_item_id, user_id, menu_item:menu_items(id, name), user:users(id, name, email, avatar_url)',
      )
      .in('menu_item_id', itemIds)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error(`Could not load photos: ${error.message}`);
    }
    setPhotos((data ?? []) as any);
    setLoading(false);
  }, [locationId]);

  React.useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Default the upload target to first item when items load
  React.useEffect(() => {
    if (!uploadTarget && menuItems[0]) setUploadTarget(menuItems[0].id);
  }, [menuItems, uploadTarget]);

  if (!currentBrandId) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={Camera}
          title="No brand selected"
          description="Pick a brand from the sidebar to manage its photos."
        />
      </div>
    );
  }

  if (isAll || !locationId || !currentLocation) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={MapPin}
          title="Pick a specific location"
          description="Photos are managed per location. Use the location switcher in the sidebar."
        />
      </div>
    );
  }

  async function toggleFeatured(photo: PhotoRow) {
    const supabase = createClient();
    const next = !photo.is_featured;
    // Optimistic: when setting a photo as featured, unfeature siblings on the
    // same menu item.
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === photo.id) return { ...p, is_featured: next };
        if (next && p.menu_item_id === photo.menu_item_id) {
          return { ...p, is_featured: false };
        }
        return p;
      }),
    );
    if (next) {
      await supabase
        .from('menu_item_photos')
        .update({ is_featured: false })
        .eq('menu_item_id', photo.menu_item_id)
        .neq('id', photo.id);
    }
    const { error } = await supabase
      .from('menu_item_photos')
      .update({ is_featured: next })
      .eq('id', photo.id);
    if (error) {
      toast.error(`Update failed: ${error.message}`);
      fetchPhotos();
      return;
    }
    toast.success(next ? 'Marked as featured' : 'Unfeatured');
  }

  async function deletePhoto() {
    if (!delPhoto) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('menu_item_photos')
      .delete()
      .eq('id', delPhoto.id);
    if (error) {
      toast.error(`Could not delete: ${error.message}`);
      return;
    }
    toast.success('Photo deleted');
    setDelPhoto(null);
    fetchPhotos();
    router.refresh();
  }

  async function attachUploadedPhotos(urls: string[]) {
    if (!uploadTarget) {
      toast.error('Pick a dish to tag these photos to');
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const rows = urls.map((url) => ({
      menu_item_id: uploadTarget,
      photo_url: url,
      is_restaurant_uploaded: true,
      is_featured: false,
      user_id: user?.id ?? null,
    }));
    const { error } = await supabase.from('menu_item_photos').insert(rows);
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    fetchPhotos();
    router.refresh();
  }

  const filtered = photos.filter((p) => {
    if (tab === 'restaurant' && !p.is_restaurant_uploaded) return false;
    if (tab === 'customer' && p.is_restaurant_uploaded) return false;
    if (filterItemId !== 'all' && p.menu_item_id !== filterItemId) return false;
    return true;
  });

  const restaurantCount = photos.filter((p) => p.is_restaurant_uploaded).length;
  const customerCount = photos.length - restaurantCount;

  return (
    <div className="space-y-5">
      {/* Uploader */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-semibold">Add restaurant photos</p>
            <p className="text-[12.5px] text-muted-foreground">
              Drop photos and tag them to a dish — they'll appear in the
              gallery and on that menu item.
            </p>
          </div>
          <div className="w-full sm:w-[260px]">
            <Select value={uploadTarget} onValueChange={setUploadTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a dish to tag…" />
              </SelectTrigger>
              <SelectContent>
                {menuItems.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Add a menu item first.
                  </div>
                ) : (
                  menuItems.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <PhotoUploader
          bucket={STORAGE.MENU_PHOTOS}
          prefix={`items/${currentBrandId}`}
          ownerId={uploadTarget || undefined}
          onUploaded={(results) =>
            attachUploadedPhotos(results.map((r) => r.url))
          }
          disabled={menuItems.length === 0 || !uploadTarget}
          hint={
            menuItems.length === 0
              ? 'Add a menu item first — photos must be tagged to a dish.'
              : 'PNG, JPEG, WebP, GIF · up to 10 MB each'
          }
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="all">
              All <span className="ml-1.5 text-muted-foreground">{photos.length}</span>
            </TabsTrigger>
            <TabsTrigger value="restaurant">
              Restaurant <span className="ml-1.5 text-muted-foreground">{restaurantCount}</span>
            </TabsTrigger>
            <TabsTrigger value="customer">
              Customer <span className="ml-1.5 text-muted-foreground">{customerCount}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="w-full sm:w-[260px]">
          <Select value={filterItemId} onValueChange={setFilterItemId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by dish…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dishes</SelectItem>
              {menuItems.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <PhotoGridSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={Camera}
            title="No photos yet"
            description={
              tab === 'customer'
                ? 'Customer photos will appear here once people start reviewing your dishes.'
                : 'Upload some photos above to get started.'
            }
          />
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <PhotoCard
              key={p.id}
              photo={p}
              onToggleFeatured={() => toggleFeatured(p)}
              onDelete={() => setDelPhoto(p)}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!delPhoto}
        onOpenChange={(o) => !o && setDelPhoto(null)}
        title="Delete this photo?"
        description="The photo will be removed from the dish gallery. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={deletePhoto}
      />
    </div>
  );
}

function PhotoCard({
  photo,
  onToggleFeatured,
  onDelete,
}: {
  photo: PhotoRow;
  onToggleFeatured: () => void;
  onDelete: () => void;
}) {
  const isRestaurant = !!photo.is_restaurant_uploaded;
  const uploaderName = isRestaurant
    ? 'Restaurant'
    : photo.user?.name ?? photo.user?.email ?? 'Customer';
  return (
    <li className="overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all hover:-translate-y-px hover:shadow-soft-md">
      <div className="relative aspect-square w-full bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.photo_url}
          alt={photo.menu_item?.name ?? 'Menu item photo'}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {photo.is_featured && (
          <Badge
            variant="primary"
            className="absolute left-2 top-2 gap-1 shadow-soft"
          >
            <Star className="h-3 w-3 fill-current" /> Featured
          </Badge>
        )}
        {!isRestaurant && (
          <Badge
            variant="secondary"
            className="absolute right-2 top-2 shadow-soft"
            title="Customer photos can't be deleted by the restaurant"
          >
            Customer
          </Badge>
        )}
      </div>
      <div className="space-y-2 px-3 py-2.5">
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-[13px] font-semibold">
            <UtensilsCrossed className="h-3 w-3 shrink-0 text-muted-foreground" />
            {photo.menu_item?.name ?? 'Untagged dish'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {formatRelative(photo.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5">
            {photo.user?.avatar_url && (
              <AvatarImage src={photo.user.avatar_url} />
            )}
            <AvatarFallback className="text-[9px]">
              {isRestaurant ? 'R' : initials(uploaderName)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-[11.5px] text-muted-foreground">
            {uploaderName}
          </span>
        </div>
        {isRestaurant ? (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleFeatured}
              className="h-7 flex-1 gap-1 px-2 text-[11.5px]"
            >
              {photo.is_featured ? (
                <>
                  <CheckCircle2 className="h-3 w-3" /> Featured
                </>
              ) : (
                <>
                  <Star className="h-3 w-3" /> Feature
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDelete}
              aria-label="Delete photo"
              className="h-7 px-2 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <p
            className="flex items-start gap-1 text-[10.5px] text-muted-foreground"
            title="Customer photos can't be deleted by the restaurant"
          >
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Customer photos can't be deleted by the restaurant
          </p>
        )}
      </div>
    </li>
  );
}

function PhotoGridSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <li
          key={i}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-2 px-3 py-2.5">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  );
}
