'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  CopyPlus,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Upload,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FormSheet } from '@/components/FormSheet';
import { SheetBody, SheetFooter } from '@/components/ui/sheet';
import { MenuItemForm } from '@/components/forms/MenuItemForm';
import { ALL_LOCATIONS, useBrand } from '@/components/BrandContext';
import { UpgradeRequired } from '@/components/UpgradeRequired';
import { getPlan, type PlanSlug } from '@/lib/plans';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type Cat = { id: string; name: string; display_order: number | null };
type ItemPhoto = { id: string; photo_url: string; is_featured: boolean | null };
type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category_id: string | null;
  dietary_tags: string[] | null;
  is_visible: boolean;
  photos: ItemPhoto[];
};

export function MenuManager() {
  const router = useRouter();
  const { currentBrandId, currentLocationId: rawLocationId, currentLocation: rawLocation, brandLocations } =
    useBrand();
  // If the brand has only one location, treat ALL_LOCATIONS as that one
  // location so menu management works without forcing the user to pick.
  const currentLocationId =
    rawLocationId === ALL_LOCATIONS && brandLocations.length === 1
      ? brandLocations[0].id
      : rawLocationId;
  const currentLocation =
    rawLocation ?? (brandLocations.length === 1 ? brandLocations[0] : null);
  const isAll = currentLocationId === ALL_LOCATIONS;
  const locationId = isAll ? null : currentLocationId;

  const [categories, setCategories] = React.useState<Cat[]>([]);
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
  const [upgradeOpen, setUpgradeOpen] = React.useState(false);

  const { currentBrand: planBrand } = useBrand();
  const plan = getPlan(planBrand?.plan);
  const atItemLimit = items.length >= plan.maxMenuItemsPerLocation;

  function handleAddItem() {
    if (atItemLimit) {
      setUpgradeOpen(true);
      return;
    }
    setAddItemOpen(true);
  }

  // Modals / form state
  const [addCatOpen, setAddCatOpen] = React.useState(false);
  const [editCat, setEditCat] = React.useState<Cat | null>(null);
  const [delCat, setDelCat] = React.useState<Cat | null>(null);
  const [addItemOpen, setAddItemOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<Item | null>(null);
  const [delItem, setDelItem] = React.useState<Item | null>(null);
  const [copyItem, setCopyItem] = React.useState<Item | null>(null);
  const [copyTargets, setCopyTargets] = React.useState<Set<string>>(new Set());
  const [copyBusy, setCopyBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
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
        is_visible: i.is_visible ?? true,
        photos: i.menu_item_photos ?? [],
      })),
    );
    setLoading(false);
  }, [locationId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  if (!currentBrandId) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={UtensilsCrossed}
          title="Loading store…"
          description="One moment while we load your store data."
        />
      </div>
    );
  }

  if (isAll) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={MapPin}
          title="Pick a specific location to manage its menu"
          description="Menus are managed per location so you can vary pricing and availability. Use the location switcher in the sidebar."
        />
      </div>
    );
  }

  if (!currentLocation) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <EmptyState
          icon={MapPin}
          title="Location not found"
          description="The selected location is no longer available for this brand."
        />
      </div>
    );
  }

  async function toggleVisibility(item: Item) {
    const supabase = createClient();
    const next = !item.is_visible;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_visible: next } : i)),
    );
    const { error } = await supabase
      .from('menu_items')
      .update({ is_visible: next })
      .eq('id', item.id);
    if (error) {
      toast.error(`Update failed: ${error.message}`);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_visible: item.is_visible } : i,
        ),
      );
    }
  }

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

  /**
   * Clone an item (+ photos) into other locations of the same brand.
   * Matches/creates target categories by name so the cloned item lands
   * somewhere sensible. Per-location rows stay independent.
   */
  async function copyItemToLocations(item: Item, targetLocationIds: string[]) {
    if (targetLocationIds.length === 0) return;
    setCopyBusy(true);
    const supabase = createClient();
    try {
      const srcCategory = categories.find((c) => c.id === item.category_id);
      const categoryName = srcCategory?.name ?? null;

      let ok = 0;
      let failed = 0;
      let firstError: string | undefined;

      for (const targetLoc of targetLocationIds) {
        let targetCategoryId: string | null = null;
        if (categoryName) {
          const { data: existing } = await supabase
            .from('menu_categories')
            .select('id')
            .eq('location_id', targetLoc)
            .ilike('name', categoryName)
            .limit(1)
            .maybeSingle();
          if (existing?.id) {
            targetCategoryId = existing.id;
          } else {
            const { data: newCat, error: catErr } = await supabase
              .from('menu_categories')
              .insert({
                location_id: targetLoc,
                name: categoryName,
                display_order: (srcCategory?.display_order ?? 0) + 1,
              })
              .select('id')
              .single();
            if (catErr || !newCat) {
              failed++;
              if (!firstError)
                firstError = catErr?.message ?? 'category create failed';
              continue;
            }
            targetCategoryId = newCat.id;
          }
        }

        const { data: newItem, error: itemErr } = await supabase
          .from('menu_items')
          .insert({
            location_id: targetLoc,
            category_id: targetCategoryId,
            name: item.name,
            description: item.description,
            price: item.price,
            dietary_tags: item.dietary_tags,
            is_visible: item.is_visible,
          })
          .select('id')
          .single();
        if (itemErr || !newItem) {
          failed++;
          if (!firstError) firstError = itemErr?.message ?? 'item create failed';
          continue;
        }

        if (item.photos.length > 0) {
          const photoRows = item.photos.map((p, i) => ({
            menu_item_id: newItem.id,
            photo_url: p.photo_url,
            is_featured: i === 0,
            is_restaurant_uploaded: true,
          }));
          await supabase.from('menu_item_photos').insert(photoRows);
        }
        ok++;
      }

      if (ok > 0) {
        toast.success(
          `Copied "${item.name}" to ${ok} location${ok === 1 ? '' : 's'}` +
            (failed > 0 ? ` · ${failed} failed` : ''),
        );
      }
      if (ok === 0 && failed > 0) {
        toast.error(`Copy failed${firstError ? `: ${firstError}` : ''}`);
      }
      setCopyItem(null);
      setCopyTargets(new Set());
      router.refresh();
    } finally {
      setCopyBusy(false);
    }
  }

  function toggleCollapse(catId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  const otherLocations = brandLocations.filter((l) => l.id !== locationId);
  const uncategorized = items.filter((i) => !i.category_id);

  return (
    <Tabs defaultValue="location" className="space-y-4">
      <TabsList>
        <TabsTrigger value="location">This location's menu</TabsTrigger>
        <TabsTrigger value="master" disabled>
          Master menu (coming soon)
        </TabsTrigger>
      </TabsList>

      <TabsContent value="location" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Managing menu for</p>
            <p className="text-base font-semibold">
              {currentLocation.name}
              {currentLocation.city ? (
                <span className="text-muted-foreground"> · {currentLocation.city}</span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild className="gap-1.5">
              <Link href="/dashboard/menu/bulk-upload">
                <Upload className="h-4 w-4" /> Bulk upload
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => setAddCatOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add category
            </Button>
            <Button
              onClick={handleAddItem}
              className="gap-1.5"
              disabled={categories.length === 0}
              title={
                categories.length === 0
                  ? 'Create a category first'
                  : undefined
              }
            >
              <Plus className="h-4 w-4" /> Add menu item
            </Button>
          </div>
        </div>

        {loading ? (
          <MenuSkeleton />
        ) : categories.length === 0 ? (
          <div className="rounded-xl border border-border bg-card">
            <EmptyState
              icon={UtensilsCrossed}
              title="No categories yet"
              description="Start by adding a menu category — Appetizers, Mains, Drinks…"
              action={
                <Button onClick={() => setAddCatOpen(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add category
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => {
              const catItems = items.filter((i) => i.category_id === cat.id);
              const isCollapsed = collapsed.has(cat.id);
              return (
                <div
                  key={cat.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 sm:px-4">
                    <button
                      type="button"
                      onClick={() => toggleCollapse(cat.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-warm-100"
                      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{cat.name}</p>
                      <p className="text-[11.5px] text-muted-foreground">
                        {catItems.length} item
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

                  {!isCollapsed &&
                    (catItems.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No items in this category yet.
                      </p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {catItems.map((item) => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            otherLocationsCount={otherLocations.length}
                            onToggleVisibility={() => toggleVisibility(item)}
                            onEdit={() => setEditItem(item)}
                            onDelete={() => setDelItem(item)}
                            onCopy={() => {
                              setCopyItem(item);
                              setCopyTargets(new Set());
                            }}
                          />
                        ))}
                      </ul>
                    ))}
                </div>
              );
            })}

            {uncategorized.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-dashed border-border bg-card">
                <div className="border-b border-border px-4 py-2.5">
                  <p className="font-semibold">Uncategorized</p>
                  <p className="text-[11.5px] text-muted-foreground">
                    Items without a category — open and assign one.
                  </p>
                </div>
                <ul className="divide-y divide-border">
                  {uncategorized.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      otherLocationsCount={otherLocations.length}
                      onToggleVisibility={() => toggleVisibility(item)}
                      onEdit={() => setEditItem(item)}
                      onDelete={() => setDelItem(item)}
                      onCopy={() => {
                        setCopyItem(item);
                        setCopyTargets(new Set());
                      }}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </TabsContent>

      {/* Add / Edit category */}
      <CategoryForm
        open={addCatOpen}
        onOpenChange={setAddCatOpen}
        locationId={locationId!}
        defaultDisplayOrder={categories.length + 1}
        onSaved={refresh}
      />
      <CategoryForm
        open={!!editCat}
        onOpenChange={(o) => !o && setEditCat(null)}
        locationId={locationId!}
        defaultDisplayOrder={categories.length + 1}
        category={editCat}
        onSaved={refresh}
      />

      {/* Add / Edit item */}
      <MenuItemForm
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        locationId={locationId!}
        brandId={currentBrandId}
        categories={categories}
        onSaved={refresh}
      />
      <MenuItemForm
        open={!!editItem}
        onOpenChange={(o) => !o && setEditItem(null)}
        locationId={locationId!}
        brandId={currentBrandId}
        categories={categories}
        item={
          editItem
            ? {
                id: editItem.id,
                name: editItem.name,
                description: editItem.description,
                price: editItem.price,
                category_id: editItem.category_id ?? '',
                dietary_tags: editItem.dietary_tags,
                is_visible: editItem.is_visible,
                photos: editItem.photos
                  .filter((p) => !!p.photo_url)
                  .sort((a, b) =>
                    a.is_featured === b.is_featured ? 0 : a.is_featured ? -1 : 1,
                  )
                  .map((p) => p.photo_url),
              }
            : null
        }
        onSaved={refresh}
      />

      <UpgradeRequired
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={(planBrand?.plan ?? 'free') as PlanSlug}
        feature="menuItems"
        context={`You're at ${items.length} of ${plan.maxMenuItemsPerLocation} items on your ${plan.name} plan`}
      />

      <ConfirmDialog
        open={!!delCat}
        onOpenChange={(o) => !o && setDelCat(null)}
        title={`Delete "${delCat?.name}"?`}
        description="Items in this category will become uncategorized."
        confirmLabel="Delete"
        destructive
        onConfirm={deleteCategory}
      />
      <ConfirmDialog
        open={!!delItem}
        onOpenChange={(o) => !o && setDelItem(null)}
        title={`Delete "${delItem?.name}"?`}
        description="This permanently removes the dish and its photos."
        confirmLabel="Delete"
        destructive
        onConfirm={deleteItem}
      />

      {/* Copy to other locations */}
      <Dialog
        open={!!copyItem}
        onOpenChange={(o) => {
          if (!o && !copyBusy) {
            setCopyItem(null);
            setCopyTargets(new Set());
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Copy "{copyItem?.name}" to other locations
            </DialogTitle>
            <DialogDescription>
              Pick the locations to add this item to. Each copy is independent
              — change the price or hide it per location after.
            </DialogDescription>
          </DialogHeader>

          {otherLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This brand only has one location. Add another from the Locations
              tab to enable copying.
            </p>
          ) : (
            <div className="max-h-[320px] space-y-1.5 overflow-y-auto">
              {otherLocations.map((l) => {
                const checked = copyTargets.has(l.id);
                return (
                  <label
                    key={l.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border bg-card px-3 py-2.5 hover:border-warm-300"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) => {
                        const next = new Set(copyTargets);
                        if (c) next.add(l.id);
                        else next.delete(l.id);
                        setCopyTargets(next);
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium">{l.name}</p>
                      {l.city && (
                        <p className="text-[11.5px] text-muted-foreground">
                          {l.city}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {copyItem &&
            categories.find((c) => c.id === copyItem.category_id) && (
              <p className="text-[12px] text-muted-foreground">
                Category{' '}
                <span className="font-semibold">
                  "
                  {categories.find((c) => c.id === copyItem.category_id)?.name}
                  "
                </span>{' '}
                will be created in any target that doesn't already have it.
              </p>
            )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCopyItem(null);
                setCopyTargets(new Set());
              }}
              disabled={copyBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() =>
                copyItem &&
                copyItemToLocations(copyItem, Array.from(copyTargets))
              }
              disabled={copyBusy || copyTargets.size === 0}
            >
              {copyBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Copying…
                </>
              ) : (
                `Copy to ${copyTargets.size || ''} location${
                  copyTargets.size === 1 ? '' : 's'
                }`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}

function ItemRow({
  item,
  otherLocationsCount,
  onToggleVisibility,
  onEdit,
  onDelete,
  onCopy,
}: {
  item: Item;
  otherLocationsCount: number;
  onToggleVisibility: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
}) {
  const cover = item.photos.find((p) => p.is_featured) ?? item.photos[0];
  return (
    <li className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
      <Avatar className="h-14 w-14 shrink-0 rounded-md">
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
          <p className="line-clamp-1 text-[12.5px] text-muted-foreground">
            {item.description}
          </p>
        )}
        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.dietary_tags.map((t) => (
              <Badge key={t} variant="default" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Switch
            checked={item.is_visible}
            onCheckedChange={onToggleVisibility}
            aria-label={item.is_visible ? 'Hide item' : 'Show item'}
          />
          <span className="hidden sm:inline">
            {item.is_visible ? 'Visible' : 'Hidden'}
          </span>
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only">Edit</span>
        </Button>
        {otherLocationsCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            aria-label="Copy to other locations"
            title="Copy to other locations"
          >
            <CopyPlus className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          aria-label="Delete"
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}

function MenuSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-5 w-40" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Inline CategoryForm — small enough to keep here
// ─────────────────────────────────────────────────────────────────────────

function CategoryForm({
  open,
  onOpenChange,
  locationId,
  defaultDisplayOrder,
  category,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  defaultDisplayOrder: number;
  category?: Cat | null;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const isEdit = !!category;
  const [name, setName] = React.useState('');
  const [order, setOrder] = React.useState<string>('1');
  const [busy, setBusy] = React.useState(false);
  const submittingRef = React.useRef(false);

  React.useEffect(() => {
    if (open) {
      setName(category?.name ?? '');
      setOrder(String(category?.display_order ?? defaultDisplayOrder));
    }
  }, [open, category, defaultDisplayOrder]);

  async function save() {
    if (submittingRef.current) return;
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    submittingRef.current = true;
    setBusy(true);
    const supabase = createClient();
    const payload = {
      location_id: locationId,
      name: name.trim(),
      display_order: Number(order) || 0,
    };
    const { error } =
      isEdit && category
        ? await supabase
            .from('menu_categories')
            .update(payload)
            .eq('id', category.id)
        : await supabase.from('menu_categories').insert(payload);
    setBusy(false);
    submittingRef.current = false;
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    toast.success(isEdit ? 'Category updated' : 'Category added');
    onOpenChange(false);
    onSaved?.();
    router.refresh();
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit category' : 'Add category'}
      description="Categories group menu items — e.g. Appetizers, Mains, Drinks."
    >
      <SheetBody className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cat-name">Name *</Label>
          <Input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Appetizers"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-order">Display order</Label>
          <Input
            id="cat-order"
            type="number"
            min={0}
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
          <p className="text-[11.5px] text-muted-foreground">
            Lower numbers appear first in the menu list.
          </p>
        </div>
      </SheetBody>
      <SheetFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={save}
          disabled={busy}
          className="w-full sm:w-auto"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : isEdit ? (
            'Save changes'
          ) : (
            'Add category'
          )}
        </Button>
      </SheetFooter>
    </FormSheet>
  );
}

// Keep `cn` import live-used at least once (silences unused-import noise in
// some lints — and helps if someone adds className overrides later).
void cn;
