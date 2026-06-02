'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles } from 'lucide-react';
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

export type MenuItemFormItem = {
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
  item?: MenuItemFormItem | null;
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

  const submittingRef = React.useRef(false);
  const [aiBusy, setAiBusy] = React.useState(false);
  // `null` = unknown, `true`/`false` = checked. We probe lazily on first click.
  const [aiAvailable, setAiAvailable] = React.useState<boolean | null>(null);

  async function generateDescription() {
    const name = form.getValues('name').trim();
    if (!name) {
      toast.error('Add a dish name first');
      return;
    }
    setAiBusy(true);
    try {
      const res = await fetch('/api/ai/menu-description', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          itemName: name,
          details: form.getValues('description') ?? '',
        }),
      });
      if (res.status === 503) {
        setAiAvailable(false);
        toast.error('Connect Anthropic in Settings → Integrations to use AI');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? 'AI generation failed');
        return;
      }
      const body = (await res.json()) as { description?: string };
      if (!body.description) {
        toast.error('AI returned no description');
        return;
      }
      form.setValue('description', body.description, { shouldDirty: true });
      setAiAvailable(true);
      toast.success('Description generated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI generation failed');
    } finally {
      setAiBusy(false);
    }
  }

  async function onSubmit(values: FormValues) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await doSubmit(values);
    } finally {
      submittingRef.current = false;
    }
  }

  async function doSubmit(values: FormValues) {
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

    // Sync photos: clear existing restaurant-uploaded rows and re-insert.
    // We only touch is_restaurant_uploaded=true rows so customer photos
    // (uploaded via review flow) are preserved.
    if (photos && photos.length > 0) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase
        .from('menu_item_photos')
        .delete()
        .eq('menu_item_id', itemId)
        .eq('is_restaurant_uploaded', true);
      const rows = photos.map((url, i) => ({
        menu_item_id: itemId,
        photo_url: url,
        is_featured: i === 0,
        is_restaurant_uploaded: true,
        user_id: user?.id ?? null,
      }));
      const { error: photoErr } = await supabase
        .from('menu_item_photos')
        .insert(rows);
      if (photoErr) {
        toast.error(`Saved item but photos failed: ${photoErr.message}`);
      }
    } else if (isEdit) {
      await supabase
        .from('menu_item_photos')
        .delete()
        .eq('menu_item_id', itemId)
        .eq('is_restaurant_uploaded', true);
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
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <FormLabel>Description</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateDescription}
                      disabled={aiBusy || aiAvailable === false}
                      title={
                        aiAvailable === false
                          ? 'Connect Anthropic in Settings → Integrations'
                          : 'Use AI to draft a description'
                      }
                      className="h-7 gap-1.5 text-[12px]"
                    >
                      {aiBusy ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />{' '}
                          Generating…
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" /> Generate description
                          with AI
                        </>
                      )}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="House tagliatelle, black truffle, parmigiano…"
                      {...field}
                    />
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
                    First photo becomes the cover. Existing restaurant photos
                    are replaced on save — customer-uploaded photos stay.
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
                      <FormLabel className="text-sm">
                        Visible to customers
                      </FormLabel>
                      <FormDescription>
                        Off keeps the dish on the menu without showing it in
                        the app.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
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
