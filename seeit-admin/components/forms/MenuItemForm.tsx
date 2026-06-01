'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SheetBody, SheetFooter } from '@/components/ui/sheet';
import { MultiSelect } from '@/components/MultiSelect';
import { PhotoUpload } from '@/components/PhotoUpload';
import { FormSheet } from '@/components/FormSheet';
import { DIETARY_TAGS, STORAGE } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  description: z.string().max(500).optional().or(z.literal('')),
  price: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : Number(v))),
  category_id: z.string().min(1, 'Pick a category'),
  dietary_tags: z.array(z.string()).default([]),
  is_visible: z.boolean().default(true),
  photos: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

type ExistingItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category_id: string;
  dietary_tags: string[] | null;
  is_visible: boolean;
  photos?: string[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  brandId: string;
  categories: { id: string; name: string }[];
  item?: ExistingItem | null;
  onSaved?: () => void;
};

export function MenuItemForm({
  open,
  onOpenChange,
  locationId,
  brandId,
  categories,
  item,
  onSaved,
}: Props) {
  const router = useRouter();
  const isEdit = !!item;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name ?? '',
      description: item?.description ?? '',
      price: (item?.price ?? '') as any,
      category_id: item?.category_id ?? '',
      dietary_tags: item?.dietary_tags ?? [],
      is_visible: item?.is_visible ?? true,
      photos: item?.photos ?? [],
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: item?.name ?? '',
        description: item?.description ?? '',
        price: (item?.price ?? '') as any,
        category_id: item?.category_id ?? '',
        dietary_tags: item?.dietary_tags ?? [],
        is_visible: item?.is_visible ?? true,
        photos: item?.photos ?? [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id]);

  async function onSubmit(values: FormValues) {
    const supabase = createClient();
    const { photos, ...rest } = values;

    const payload = {
      ...rest,
      location_id: locationId,
      description: rest.description || null,
      price: rest.price ?? null,
    };

    let itemId: string;
    if (isEdit && item) {
      const { error } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', item.id);
      if (error) {
        toast.error(`Save failed: ${error.message}`);
        return;
      }
      itemId = item.id;
    } else {
      const { data, error } = await supabase
        .from('menu_items')
        .insert(payload)
        .select('id')
        .single();
      if (error) {
        toast.error(`Create failed: ${error.message}`);
        return;
      }
      itemId = data.id;
    }

    // Sync photos: replace all by deleting existing + re-inserting.
    // Simple and predictable for the admin workflow.
    if (photos && photos.length > 0) {
      await supabase.from('menu_item_photos').delete().eq('menu_item_id', itemId);
      const rows = photos.map((url, i) => ({
        menu_item_id: itemId,
        url,
        is_cover: i === 0,
      }));
      const { error: photoErr } = await supabase
        .from('menu_item_photos')
        .insert(rows);
      if (photoErr) {
        toast.error(`Saved item but photos failed: ${photoErr.message}`);
      }
    } else if (isEdit) {
      // No photos at all → clear out
      await supabase.from('menu_item_photos').delete().eq('menu_item_id', itemId);
    }

    toast.success(isEdit ? `Updated "${payload.name}"` : `Created "${payload.name}"`);
    onOpenChange(false);
    onSaved?.();
    router.refresh();
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${item?.name ?? 'dish'}` : 'Add menu item'}
      description="Photos help customers decide — add at least one if you can."
      size="lg"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex h-full min-h-0 flex-col"
        >
          <SheetBody className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dish name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Truffle Tagliatelle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pick a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          No categories yet — create one first.
                        </div>
                      ) : (
                        categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="26.00"
                      {...field}
                      value={(field.value as any) ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="House tagliatelle, black truffle, parmigiano…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dietary_tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dietary tags</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={DIETARY_TAGS}
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Customers filter dishes by these.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photos</FormLabel>
                  <FormControl>
                    <PhotoUpload
                      bucket={STORAGE.MENU_PHOTOS}
                      prefix={`items/${brandId}`}
                      value={field.value ?? []}
                      onChange={(urls) => field.onChange(urls)}
                      multiple
                    />
                  </FormControl>
                  <FormDescription>
                    First photo becomes the cover. Existing photos are replaced on save.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <FormField
                control={form.control}
                name="is_visible"
                render={({ field }) => (
                  <FormItem className="flex flex-1 items-center justify-between gap-3 space-y-0">
                    <div>
                      <FormLabel className="text-sm">Visible to customers</FormLabel>
                      <FormDescription>
                        Off keeps the dish on the menu without showing it in the app.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
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
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full sm:w-auto"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : isEdit ? (
                'Save changes'
              ) : (
                'Create item'
              )}
            </Button>
          </SheetFooter>
        </form>
      </Form>
    </FormSheet>
  );
}
