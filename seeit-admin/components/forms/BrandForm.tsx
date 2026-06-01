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
import {
  PRIMARY_CUISINES,
  SUBSCRIPTION_STATUSES,
  STORAGE,
} from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  description: z.string().max(1000).optional().or(z.literal('')),
  primary_cuisine: z.string().min(1, 'Pick a primary cuisine'),
  secondary_cuisines: z.array(z.string()).default([]),
  logo_url: z.string().url().optional().nullable().or(z.literal('')),
  owner_email: z
    .string()
    .email('Invalid email')
    .optional()
    .or(z.literal('')),
  subscription_status: z.string().default('inactive'),
});

type FormValues = z.infer<typeof schema>;

type ExistingBrand = {
  id: string;
  name: string;
  description: string | null;
  primary_cuisine: string | null;
  secondary_cuisines: string[] | null;
  logo_url: string | null;
  owner_id: string | null;
  subscription_status: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: ExistingBrand | null;
  /** When defined, populated from a previous detail-page fetch. */
  ownerEmail?: string | null;
  onSaved?: (brandId: string) => void;
};

export function BrandForm({ open, onOpenChange, brand, ownerEmail, onSaved }: Props) {
  const router = useRouter();
  const isEdit = !!brand;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: brand?.name ?? '',
      description: brand?.description ?? '',
      primary_cuisine: brand?.primary_cuisine ?? '',
      secondary_cuisines: brand?.secondary_cuisines ?? [],
      logo_url: brand?.logo_url ?? '',
      owner_email: ownerEmail ?? '',
      subscription_status: brand?.subscription_status ?? 'inactive',
    },
  });

  // Reset form when brand changes (switching between create/edit)
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: brand?.name ?? '',
        description: brand?.description ?? '',
        primary_cuisine: brand?.primary_cuisine ?? '',
        secondary_cuisines: brand?.secondary_cuisines ?? [],
        logo_url: brand?.logo_url ?? '',
        owner_email: ownerEmail ?? '',
        subscription_status: brand?.subscription_status ?? 'inactive',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, brand?.id]);

  async function onSubmit(values: FormValues) {
    const supabase = createClient();

    // Resolve owner email → user id
    let ownerId: string | null = brand?.owner_id ?? null;
    if (values.owner_email) {
      const { data: ownerRow, error: ownerErr } = await supabase
        .from('users')
        .select('id')
        .eq('email', values.owner_email)
        .maybeSingle();
      if (ownerErr) {
        toast.error(`Owner lookup failed: ${ownerErr.message}`);
        return;
      }
      if (!ownerRow) {
        toast.error(
          `No user with email ${values.owner_email}. Invite them first or leave blank.`,
        );
        return;
      }
      ownerId = ownerRow.id;
    } else if (!isEdit) {
      // Creating with no owner → leave null
      ownerId = null;
    }

    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      primary_cuisine: values.primary_cuisine,
      secondary_cuisines: values.secondary_cuisines,
      logo_url: values.logo_url || null,
      owner_id: ownerId,
      subscription_status: values.subscription_status,
    };

    if (isEdit && brand) {
      const { error } = await supabase
        .from('brands')
        .update(payload)
        .eq('id', brand.id);
      if (error) {
        toast.error(`Save failed: ${error.message}`);
        return;
      }
      toast.success(`Updated ${payload.name}`);
      onOpenChange(false);
      onSaved?.(brand.id);
      router.refresh();
    } else {
      const { data, error } = await supabase
        .from('brands')
        .insert(payload)
        .select('id')
        .single();
      if (error) {
        toast.error(`Create failed: ${error.message}`);
        return;
      }
      toast.success(`Created ${payload.name}`);
      form.reset();
      onOpenChange(false);
      onSaved?.(data.id);
      router.refresh();
    }
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${brand?.name ?? 'brand'}` : 'Add brand'}
      description={
        isEdit ? 'Update brand-level details.' : 'Create a new restaurant brand.'
      }
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
                  <FormLabel>Brand name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Bella's Italian Kitchen" {...field} />
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
                    <Textarea
                      rows={3}
                      placeholder="A short brand description shown across the customer app."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primary_cuisine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary cuisine *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pick a cuisine" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRIMARY_CUISINES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
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
              name="secondary_cuisines"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary cuisines</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={PRIMARY_CUISINES}
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="Pick any extras"
                    />
                  </FormControl>
                  <FormDescription>
                    For brands that span multiple cuisines (e.g. Italian + Pizzeria).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <FormControl>
                    <PhotoUpload
                      bucket={STORAGE.RESTAURANT_PHOTOS}
                      prefix="brand-logos"
                      value={field.value || null}
                      onChange={(url) => field.onChange(url ?? '')}
                    />
                  </FormControl>
                  <FormDescription>
                    Square, at least 200 × 200 px recommended.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="owner_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="owner@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Must match an existing user. Leave blank to assign later.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subscription_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUBSCRIPTION_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Manual for now — Stripe sync will overwrite this later.
                  </FormDescription>
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
              disabled={form.formState.isSubmitting}
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
                'Create brand'
              )}
            </Button>
          </SheetFooter>
        </form>
      </Form>
    </FormSheet>
  );
}
