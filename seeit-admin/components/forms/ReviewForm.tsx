'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Star } from 'lucide-react';
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
import { MOOD_TAGS, PORTION_SIZES, STORAGE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { PortionSize } from '@/lib/database.types';

const schema = z.object({
  user_email: z.string().email('Pick a user by email').optional().or(z.literal('')),
  location_id: z.string().min(1, 'Pick a location'),
  menu_item_id: z.string().optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional().or(z.literal('')),
  portion_size: z.string().optional().or(z.literal('')),
  worth_it: z
    .union([z.boolean(), z.literal('skip')])
    .optional()
    .nullable(),
  mood_tags: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

type ExistingReview = {
  id: string;
  user_id: string;
  location_id: string;
  menu_item_id: string | null;
  rating: number;
  text: string | null;
  portion_size: string | null;
  worth_it: boolean | null;
  mood_tags: string[] | null;
  photos?: string[];
  user_email?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review?: ExistingReview | null;
  onSaved?: () => void;
};

export function ReviewForm({ open, onOpenChange, review, onSaved }: Props) {
  const router = useRouter();
  const isEdit = !!review;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      user_email: review?.user_email ?? '',
      location_id: review?.location_id ?? '',
      menu_item_id: review?.menu_item_id ?? '',
      rating: review?.rating ?? 5,
      text: review?.text ?? '',
      portion_size: review?.portion_size ?? '',
      worth_it:
        review?.worth_it === true
          ? true
          : review?.worth_it === false
          ? false
          : 'skip',
      mood_tags: review?.mood_tags ?? [],
      photos: review?.photos ?? [],
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset(form.getValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, review?.id]);

  const [locations, setLocations] = React.useState<
    { id: string; label: string }[]
  >([]);
  const [menuItems, setMenuItems] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [locQuery, setLocQuery] = React.useState('');
  const watchedLocId = form.watch('location_id');

  // Search locations as the admin types
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      const supabase = createClient();
      let query = supabase
        .from('locations')
        .select('id, name, address, city, brand:brands(name)')
        .order('created_at', { ascending: false })
        .limit(20);
      if (locQuery) query = query.ilike('name', `%${locQuery}%`);
      const { data } = await query;
      if (cancelled) return;
      setLocations(
        (data ?? []).map((l: any) => ({
          id: l.id,
          label: `${l.brand?.name ? l.brand.name + ' — ' : ''}${l.name} · ${l.city}`,
        })),
      );
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [locQuery]);

  // Load menu items for the picked location
  React.useEffect(() => {
    if (!watchedLocId) {
      setMenuItems([]);
      return;
    }
    let cancelled = false;
    async function run() {
      const supabase = createClient();
      const { data } = await supabase
        .from('menu_items')
        .select('id, name')
        .eq('location_id', watchedLocId)
        .order('name', { ascending: true })
        .limit(100);
      if (!cancelled) setMenuItems((data ?? []) as { id: string; name: string }[]);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [watchedLocId]);

  async function onSubmit(values: FormValues) {
    const supabase = createClient();

    // Resolve user email to id (only required on create — edit keeps existing user)
    let userId: string | null = review?.user_id ?? null;
    if (!isEdit) {
      if (!values.user_email) {
        toast.error('Pick a user by email');
        return;
      }
      const { data: row, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', values.user_email)
        .maybeSingle();
      if (error) {
        toast.error(`User lookup failed: ${error.message}`);
        return;
      }
      if (!row) {
        toast.error(`No user with email ${values.user_email}`);
        return;
      }
      userId = row.id;
    }
    if (!userId) {
      toast.error('Missing user id');
      return;
    }

    const payload = {
      user_id: userId,
      location_id: values.location_id,
      menu_item_id: values.menu_item_id || null,
      rating: values.rating,
      text: values.text || null,
      portion_size: (values.portion_size || null) as PortionSize | null,
      worth_it:
        values.worth_it === true ? true : values.worth_it === false ? false : null,
      mood_tags: values.mood_tags,
    };

    let reviewId: string;
    if (isEdit && review) {
      const { error } = await supabase
        .from('reviews')
        .update(payload)
        .eq('id', review.id);
      if (error) {
        toast.error(`Save failed: ${error.message}`);
        return;
      }
      reviewId = review.id;
    } else {
      const { data, error } = await supabase
        .from('reviews')
        .insert(payload)
        .select('id')
        .single();
      if (error) {
        toast.error(`Create failed: ${error.message}`);
        return;
      }
      reviewId = data.id;
    }

    // Sync photos (replace all on save)
    if (values.photos.length > 0) {
      await supabase.from('review_photos').delete().eq('review_id', reviewId);
      const rows = values.photos.map((url) => ({
        review_id: reviewId,
        photo_url: url,
      }));
      const { error: photoErr } = await supabase
        .from('review_photos')
        .insert(rows);
      if (photoErr) {
        toast.error(`Saved review but photos failed: ${photoErr.message}`);
      }
    } else if (isEdit) {
      await supabase.from('review_photos').delete().eq('review_id', reviewId);
    }

    toast.success(isEdit ? 'Review updated' : 'Review created');
    onOpenChange(false);
    onSaved?.();
    router.refresh();
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit review' : 'Add review'}
      description={
        isEdit
          ? 'Edit text, rating, and metadata for this review.'
          : 'Manually post a review on behalf of a real user. Useful for seeding.'
      }
      size="lg"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex h-full min-h-0 flex-col"
        >
          <SheetBody className="space-y-5">
            {!isEdit && (
              <FormField
                control={form.control}
                name="user_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="reviewer@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Must match an existing user.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location *</FormLabel>
                  <div className="space-y-2">
                    <Input
                      placeholder="Search location…"
                      value={locQuery}
                      onChange={(e) => setLocQuery(e.target.value)}
                    />
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.length === 0 ? (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            No matches.
                          </div>
                        ) : (
                          locations.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="menu_item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu item (optional)</FormLabel>
                  <Select
                    value={field.value || '__none__'}
                    onValueChange={(v) =>
                      field.onChange(v === '__none__' ? '' : v)
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pick a dish — or leave blank for overall review" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">— overall review —</SelectItem>
                      {menuItems.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating *</FormLabel>
                  <FormControl>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => field.onChange(n)}
                          className={cn(
                            'rounded p-1 transition-colors',
                            n <= field.value
                              ? 'text-amber-500'
                              : 'text-muted-foreground/40 hover:text-muted-foreground',
                          )}
                          aria-label={`${n} stars`}
                        >
                          <Star
                            className="h-7 w-7"
                            fill={n <= field.value ? 'currentColor' : 'none'}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review text</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="What did they say about it?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="portion_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portion size</FormLabel>
                  <Select
                    value={field.value || '__none__'}
                    onValueChange={(v) =>
                      field.onChange(v === '__none__' ? '' : v)
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Skip" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">— skip —</SelectItem>
                      {PORTION_SIZES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="worth_it"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Worth the price?</FormLabel>
                  <Select
                    value={String(field.value ?? 'skip')}
                    onValueChange={(v) =>
                      field.onChange(v === 'true' ? true : v === 'false' ? false : 'skip')
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="skip">— skip —</SelectItem>
                      <SelectItem value="true">Yes, worth it</SelectItem>
                      <SelectItem value="false">Overpriced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mood_tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mood tags</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={MOOD_TAGS}
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  </FormControl>
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
                      bucket={STORAGE.REVIEW_PHOTOS}
                      prefix="reviews"
                      value={field.value ?? []}
                      onChange={field.onChange}
                      multiple
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                'Create review'
              )}
            </Button>
          </SheetFooter>
        </form>
      </Form>
    </FormSheet>
  );
}
