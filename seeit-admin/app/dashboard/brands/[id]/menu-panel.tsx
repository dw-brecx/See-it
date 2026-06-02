'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Eye, EyeOff, GripVertical, MapPin, Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { MenuCategoryForm } from '@/components/forms/MenuCategoryForm';
import { MenuItemForm } from '@/components/forms/MenuItemForm';
import { createClient } from '@/lib/supabase/client';

type Cat = { id: string; name: string; display_order: number | null };
type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category_id: string;
  dietary_tags: string[] | null;
  is_visible: boolean;
  photos: { id: string; photo_url: string; is_featured: boolean }[];
};
type Loc = { id: string; name: string; city: string };

type Props = {
  brandId: string;
  locations: Loc[];
};

export function MenuPanel({ brandId, locations }: Props) {
  const router = useRouter();
  const [locationId, setLocationId] = React.useState<string>(
    locations[0]?.id ?? '',
  );
  const [categories, setCategories] = React.useState<Cat[]>([]);
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Modals
  const [addCatOpen, setAddCatOpen] = React.useState(false);
  const [editCat, setEditCat] = React.useState<Cat | null>(null);
  const [delCat, setDelCat] = React.useState<Cat | null>(null);
  const [addItemOpen, setAddItemOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<Item | null>(null);
  const [delItem, setDelItem] = React.useState<Item | null>(null);

  async function refresh() {
    if (!locationId) return;
    setLoading(true);
    const supabase = createClient();
    const [catsRes, itemsRes] = await Promise.all([
      supabase
        .from('menu_categories')
        .select('id, name, display_order')
        .eq('location_id', locationId)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true }),
      supabase
        .from('menu_items')
        .select(
          'id, name, description, price, category_id, dietary_tags, is_visible, menu_item_photos(id, photo_url, is_featured)',
        )
        .eq('location_id', locationId)
        .order('name', { ascending: true }),
    ]);
    setCategories((catsRes.data ?? []) as Cat[]);
    setItems(
      ((itemsRes.data ?? []) as any[]).map((i) => ({
        ...i,
        photos: i.menu_item_photos ?? [],
      })),
    );
    setLoading(false);
  }

  React.useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  async function deleteCategory() {
    if (!delCat) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', delCat.id);
    if (error) {
      toast.error(`Could not delete: ${error.message}`);
      return;
    }
    toast.success(`Deleted "${delCat.name}"`);
    setDelCat(null);
    refresh();
    router.refresh();
  }

  async function duplicateItem(item: Item) {
    const supabase = createClient();
    const { data: full, error: fetchErr } = await supabase
      .from('menu_items')
      .select('location_id, category_id, name, description, price, dietary_tags, is_visible')
      .eq('id', item.id)
      .single();
    if (fetchErr || !full) {
      toast.error(`Duplicate failed: ${fetchErr?.message ?? 'not found'}`);
      return;
    }
    const { data: newRow, error: insertErr } = await supabase
      .from('menu_items')
      .insert({ ...full, name: `${full.name} (copy)` })
      .select('id')
      .single();
    if (insertErr || !newRow) {
      toast.error(`Duplicate failed: ${insertErr?.message ?? 'unknown'}`);
      return;
    }
    // Clone the photos too — same urls, same featured flag on the first one
    if (item.photos.length > 0) {
      const photoRows = item.photos.map((p, i) => ({
        menu_item_id: newRow.id,
        photo_url: p.photo_url,
        is_featured: i === 0,
      }));
      await supabase.from('menu_item_photos').insert(photoRows);
    }
    toast.success(`Duplicated "${item.name}"`);
    refresh();
    router.refresh();
  }

  async function deleteItem() {
    if (!delItem) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', delItem.id);
    if (error) {
      toast.error(`Could not delete: ${error.message}`);
      return;
    }
    toast.success(`Deleted "${delItem.name}"`);
    setDelItem(null);
    refresh();
    router.refresh();
  }

  async function moveCategory(cat: Cat, dir: -1 | 1) {
    const supabase = createClient();
    const newOrder = (cat.display_order ?? 0) + dir;
    const { error } = await supabase
      .from('menu_categories')
      .update({ display_order: newOrder })
      .eq('id', cat.id);
    if (error) {
      toast.error(`Reorder failed: ${error.message}`);
      return;
    }
    refresh();
  }

  if (locations.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={MapPin}
          title="Add a location first"
          description="Menus belong to a specific location. Add one in the Locations tab to start building a menu."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="w-full sm:w-[260px]">
            <SelectValue placeholder="Pick a location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name} {l.city ? `· ${l.city}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setAddCatOpen(true)}
            className="flex-1 gap-1.5 sm:flex-initial"
            disabled={!locationId}
          >
            <Plus className="h-4 w-4" /> Add category
          </Button>
          <Button
            onClick={() => setAddItemOpen(true)}
            className="flex-1 gap-1.5 sm:flex-initial"
            disabled={!locationId || categories.length === 0}
            title={
              categories.length === 0 ? 'Create a category first' : undefined
            }
          >
            <Plus className="h-4 w-4" /> Add menu item
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading menu…
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={UtensilsCrossed}
            title="No categories yet"
            description="Start by adding a menu category (Appetizers, Pasta, Pizza…)."
            action={
              <Button onClick={() => setAddCatOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Add category
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.category_id === cat.id);
            return (
              <div
                key={cat.id}
                className="rounded-xl border border-border bg-card"
              >
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => moveCategory(cat, -1)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                      aria-label="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategory(cat, 1)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                      aria-label="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Order #{cat.display_order ?? 0} · {catItems.length} item
                      {catItems.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditCat(cat)}
                    aria-label="Edit category"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDelCat(cat)}
                    aria-label="Delete category"
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {catItems.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No items in this category yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {catItems.map((item) => {
                      const cover =
                        item.photos.find((p) => p.is_featured) ?? item.photos[0];
                      return (
                        <li
                          key={item.id}
                          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
                        >
                          <Avatar className="h-12 w-12 shrink-0 rounded-md">
                            {cover ? <AvatarImage src={cover.photo_url} /> : null}
                            <AvatarFallback className="rounded-md">
                              <UtensilsCrossed className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-medium">{item.name}</p>
                              {!item.is_visible && (
                                <Badge variant="warning" className="gap-1">
                                  <EyeOff className="h-3 w-3" /> Hidden
                                </Badge>
                              )}
                              {item.price != null && (
                                <span className="text-sm font-semibold text-muted-foreground">
                                  ${Number(item.price).toFixed(2)}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="line-clamp-1 text-xs text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                            {item.dietary_tags &&
                              item.dietary_tags.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {item.dietary_tags.map((t) => (
                                    <Badge
                                      key={t}
                                      variant="default"
                                      className="text-[10px]"
                                    >
                                      {t}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => setEditItem(item)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only sm:not-sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => duplicateItem(item)}
                              aria-label="Duplicate"
                              title="Duplicate"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setDelItem(item)}
                              aria-label="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <MenuCategoryForm
        open={addCatOpen}
        onOpenChange={setAddCatOpen}
        locationId={locationId}
        onSaved={refresh}
      />
      <MenuCategoryForm
        open={!!editCat}
        onOpenChange={(o) => !o && setEditCat(null)}
        locationId={locationId}
        category={editCat}
        onSaved={refresh}
      />
      <MenuItemForm
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        locationId={locationId}
        brandId={brandId}
        categories={categories}
        onSaved={refresh}
      />
      <MenuItemForm
        open={!!editItem}
        onOpenChange={(o) => !o && setEditItem(null)}
        locationId={locationId}
        brandId={brandId}
        categories={categories}
        item={
          editItem
            ? {
                ...editItem,
                photos: editItem.photos.map((p) => p.photo_url),
              }
            : null
        }
        onSaved={refresh}
      />
      <ConfirmDialog
        open={!!delCat}
        onOpenChange={(o) => !o && setDelCat(null)}
        title={`Delete "${delCat?.name}"?`}
        description="Deleting a category may also delete or orphan its items, depending on your DB cascade rules."
        confirmLabel="Delete"
        destructive
        onConfirm={deleteCategory}
      />
      <ConfirmDialog
        open={!!delItem}
        onOpenChange={(o) => !o && setDelItem(null)}
        title={`Delete "${delItem?.name}"?`}
        description="This permanently removes the menu item and its photos."
        confirmLabel="Delete"
        destructive
        onConfirm={deleteItem}
      />
    </div>
  );
}
