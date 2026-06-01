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
import { Checkbox } from '@/components/ui/checkbox';
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
import { HoursEditor } from '@/components/HoursEditor';
import { FormSheet } from '@/components/FormSheet';
import {
  DIETARY_TAGS,
  STYLE_TAGS,
  ESTABLISHMENT_TYPES,
  KOSHER_AGENCIES,
  KOSHER_TYPES,
  DEFAULT_HOURS,
  STORAGE,
  splitStyleTags,
  mergeStyleTags,
  type WeekHours,
} from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import type { KosherKind } from '@/lib/database.types';

const kosherSchema = z.object({
  agency: z.string().optional().or(z.literal('')),
  agency_other: z.string().optional().or(z.literal('')),
  kosher_type: z.string().optional().or(z.literal('')),
  is_glatt: z.boolean().default(false),
  is_cholov_yisroel: z.boolean().default(false),
  is_pas_yisroel: z.boolean().default(false),
  is_bishul_yisroel: z.boolean().default(false),
  is_yoshon: z.boolean().default(false),
  is_kosher_for_passover: z.boolean().default(false),
  certificate_image_url: z.string().optional().nullable().or(z.literal('')),
  expiration_date: z.string().optional().or(z.literal('')),
});

const schema = z.object({
  name: z.string().min(1, 'Location name is required').max(120),
  address: z.string().min(1, 'Address is required').max(200),
  city: z.string().min(1, 'City is required').max(80),
  state: z.string().min(1, 'State is required').max(80),
  zip: z.string().min(1, 'ZIP is required').max(20),
  country: z.string().min(1).default('US'),
  phone: z.string().optional().or(z.literal('')),
  latitude: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : Number(v))),
  longitude: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : Number(v))),
  cover_photo_url: z.string().optional().nullable().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
  dietary_tags: z.array(z.string()).default([]),
  establishment_types: z.array(z.string()).default([]),
  style_tags: z.array(z.string()).default([]),
  is_temporarily_closed: z.boolean().default(false),
  reopening_date: z.string().optional().or(z.literal('')),
  hours: z.any(),
  kosher: kosherSchema.optional(),
});

type FormValues = z.infer<typeof schema>;

type ExistingLocation = {
  id: string;
  brand_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_photo_url: string | null;
  description: string | null;
  dietary_tags: string[] | null;
  style_tags: string[] | null;
  is_temporarily_closed: boolean;
  reopening_date: string | null;
  hours: WeekHours | null;
};

type KosherCert = {
  id?: string;
  agency: string | null;
  agency_other?: string | null;
  kosher_type: string | null;
  is_glatt?: boolean;
  is_cholov_yisroel?: boolean;
  is_pas_yisroel?: boolean;
  is_bishul_yisroel?: boolean;
  is_yoshon?: boolean;
  is_kosher_for_passover?: boolean;
  certificate_image_url: string | null;
  expiration_date: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
  location?: ExistingLocation | null;
  kosherCert?: KosherCert | null;
  onSaved?: (locationId: string) => void;
};

export function LocationForm({
  open,
  onOpenChange,
  brandId,
  location,
  kosherCert,
  onSaved,
}: Props) {
  const router = useRouter();
  const isEdit = !!location;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: location?.name ?? '',
      address: location?.address ?? '',
      city: location?.city ?? '',
      state: location?.state ?? '',
      zip: location?.zip ?? '',
      country: location?.country ?? 'US',
      phone: location?.phone ?? '',
      latitude: (location?.latitude ?? '') as any,
      longitude: (location?.longitude ?? '') as any,
      cover_photo_url: location?.cover_photo_url ?? '',
      description: location?.description ?? '',
      dietary_tags: location?.dietary_tags ?? [],
      // Split the stored style_tags array into the two UI buckets
      establishment_types: splitStyleTags(location?.style_tags).establishment_types,
      style_tags: splitStyleTags(location?.style_tags).style_tags,
      is_temporarily_closed: !!location?.is_temporarily_closed,
      reopening_date: location?.reopening_date ?? '',
      hours: location?.hours ?? DEFAULT_HOURS,
      kosher: {
        agency: kosherCert?.agency ?? '',
        agency_other: kosherCert?.agency_other ?? '',
        kosher_type: kosherCert?.kosher_type ?? '',
        is_glatt: !!kosherCert?.is_glatt,
        is_cholov_yisroel: !!kosherCert?.is_cholov_yisroel,
        is_pas_yisroel: !!kosherCert?.is_pas_yisroel,
        is_bishul_yisroel: !!kosherCert?.is_bishul_yisroel,
        is_yoshon: !!kosherCert?.is_yoshon,
        is_kosher_for_passover: !!kosherCert?.is_kosher_for_passover,
        certificate_image_url: kosherCert?.certificate_image_url ?? '',
        expiration_date: kosherCert?.expiration_date ?? '',
      },
    },
  });

  React.useEffect(() => {
    if (open) form.reset(form.getValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, location?.id]);

  const dietary = form.watch('dietary_tags') ?? [];
  const isKosher = dietary.includes('Kosher');
  const isTemporarilyClosed = form.watch('is_temporarily_closed');
  const kosherAgency = form.watch('kosher.agency');

  async function onSubmit(values: FormValues) {
    const supabase = createClient();
    const { kosher, establishment_types, style_tags, ...locPayloadRaw } = values;

    // Preserve any tags that aren't in either constant list (set via SQL etc.)
    const other = splitStyleTags(location?.style_tags).other;

    const locPayload = {
      ...locPayloadRaw,
      brand_id: brandId,
      phone: locPayloadRaw.phone || null,
      description: locPayloadRaw.description || null,
      cover_photo_url: locPayloadRaw.cover_photo_url || null,
      reopening_date: locPayloadRaw.reopening_date || null,
      latitude: locPayloadRaw.latitude ?? null,
      longitude: locPayloadRaw.longitude ?? null,
      // Merge establishment types + style tags back into one column
      style_tags: mergeStyleTags(establishment_types, style_tags, other),
    };

    let locationId: string;

    if (isEdit && location) {
      const { error } = await supabase
        .from('locations')
        .update(locPayload)
        .eq('id', location.id);
      if (error) {
        toast.error(`Save failed: ${error.message}`);
        return;
      }
      locationId = location.id;
    } else {
      const { data, error } = await supabase
        .from('locations')
        .insert(locPayload)
        .select('id')
        .single();
      if (error) {
        toast.error(`Create failed: ${error.message}`);
        return;
      }
      locationId = data.id;
    }

    // Sync kosher cert if Kosher dietary tag is set
    if (isKosher && kosher) {
      const kosherPayload = {
        location_id: locationId,
        agency: kosher.agency || null,
        agency_other:
          kosher.agency === 'Other' ? kosher.agency_other || null : null,
        kosher_type: (kosher.kosher_type || null) as KosherKind | null,
        is_glatt: !!kosher.is_glatt,
        is_cholov_yisroel: !!kosher.is_cholov_yisroel,
        is_pas_yisroel: !!kosher.is_pas_yisroel,
        is_bishul_yisroel: !!kosher.is_bishul_yisroel,
        is_yoshon: !!kosher.is_yoshon,
        is_kosher_for_passover: !!kosher.is_kosher_for_passover,
        certificate_image_url: kosher.certificate_image_url || null,
        expiration_date: kosher.expiration_date || null,
      };
      const { error: kErr } = await supabase
        .from('kosher_certifications')
        .upsert(kosherPayload, { onConflict: 'location_id' });
      if (kErr) {
        toast.error(`Kosher cert save failed: ${kErr.message}`);
        return;
      }
    } else if (!isKosher && kosherCert?.id) {
      // Removed Kosher tag — clean up cert row
      await supabase
        .from('kosher_certifications')
        .delete()
        .eq('location_id', locationId);
    }

    toast.success(isEdit ? `Updated ${locPayload.name}` : `Created ${locPayload.name}`);
    onOpenChange(false);
    onSaved?.(locationId);
    router.refresh();
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${location?.name ?? 'location'}` : 'Add location'}
      description={
        isEdit ? 'Update location details.' : 'Add a new location to this brand.'
      }
      size="lg"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex h-full min-h-0 flex-col"
        >
          <SheetBody className="space-y-6">
            {/* Basics */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Basics
              </h3>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Brooklyn / Mission / Williamsburg" {...field} />
                    </FormControl>
                    <FormDescription>
                      Shown to customers as "Brand — Location".
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street address *</FormLabel>
                    <FormControl>
                      <Input placeholder="234 Bedford Ave" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="Brooklyn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP *</FormLabel>
                      <FormControl>
                        <Input placeholder="11211" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="US" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(718) 555-0182" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="40.7178"
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
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="-73.9624"
                          {...field}
                          value={(field.value as any) ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Location-specific blurb. Falls back to brand description if blank."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cover_photo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover photo</FormLabel>
                    <FormControl>
                      <PhotoUpload
                        bucket={STORAGE.RESTAURANT_PHOTOS}
                        prefix={`locations/${brandId}`}
                        value={field.value || null}
                        onChange={(url) => field.onChange(url ?? '')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Hours */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Hours
              </h3>
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <HoursEditor
                        value={(field.value as WeekHours) ?? DEFAULT_HOURS}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </h3>
              <div className="flex items-start gap-3 rounded-md border border-border p-3">
                <FormField
                  control={form.control}
                  name="is_temporarily_closed"
                  render={({ field }) => (
                    <FormItem className="flex flex-1 items-start justify-between gap-3 space-y-0">
                      <div>
                        <FormLabel className="text-sm">Temporarily closed</FormLabel>
                        <FormDescription>
                          Hides this location from customers until you toggle off.
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
              {isTemporarilyClosed && (
                <FormField
                  control={form.control}
                  name="reopening_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected reopening date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Tags
              </h3>
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
                        placeholder="Add dietary tags…"
                      />
                    </FormControl>
                    <FormDescription>
                      Selecting "Kosher" unlocks the certification section below.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="establishment_types"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Establishment type</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={ESTABLISHMENT_TYPES}
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="Restaurant, bakery, food truck…"
                      />
                    </FormControl>
                    <FormDescription>
                      What kind of place this is. Separate from "Style &amp; setting"
                      (vibe) below.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="style_tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Style &amp; setting</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={STYLE_TAGS}
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="Sit-down, takeout, outdoor seating…"
                      />
                    </FormControl>
                    <FormDescription>
                      Vibe and service style. Both this and "Establishment type" save into
                      the same column.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Kosher cert (only when Kosher dietary tag selected) */}
            {isKosher && (
              <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                  ✡ Kosher certification
                </h3>

                <FormField
                  control={form.control}
                  name="kosher.agency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certifying agency</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pick an agency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {KOSHER_AGENCIES.map((a) => (
                            <SelectItem key={a.value} value={a.value}>
                              {a.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {kosherAgency === 'Other' && (
                  <FormField
                    control={form.control}
                    name="kosher.agency_other"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specify agency</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Name of the certifying body"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="kosher.kosher_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kosher type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Meat / Dairy / Pareve / Mixed" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {KOSHER_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <p className="mb-2 text-sm font-medium">Sub-certifications</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {([
                      ['is_glatt', 'Glatt'],
                      ['is_cholov_yisroel', 'Cholov Yisroel'],
                      ['is_pas_yisroel', 'Pas Yisroel'],
                      ['is_bishul_yisroel', 'Bishul Yisroel'],
                      ['is_yoshon', 'Yoshon'],
                      ['is_kosher_for_passover', 'Kosher for Passover'],
                    ] as const).map(([key, label]) => (
                      <FormField
                        key={key}
                        control={form.control}
                        name={`kosher.${key}` as const}
                        render={({ field }) => (
                          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-sm">
                            <Checkbox
                              checked={!!field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span>{label}</span>
                          </label>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="kosher.certificate_image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificate image / PDF</FormLabel>
                      <FormControl>
                        <PhotoUpload
                          bucket={STORAGE.KOSHER_CERTS}
                          prefix={`certs/${brandId}`}
                          value={field.value || null}
                          onChange={(url) => field.onChange(url ?? '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="kosher.expiration_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiration date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
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
                'Create location'
              )}
            </Button>
          </SheetFooter>
        </form>
      </Form>
    </FormSheet>
  );
}
