'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  Utensils,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/MultiSelect';
import { PhotoUpload } from '@/components/PhotoUpload';
import { HoursEditor } from '@/components/HoursEditor';
import { GooglePlaceSearch } from '@/components/GooglePlaceSearch';
import {
  CUISINE_GROUPS,
  PRIMARY_CUISINES,
  DEFAULT_HOURS,
  DIETARY_TAGS,
  KOSHER_AGENCIES,
  KOSHER_TYPES,
  STORAGE,
  type WeekHours,
} from '@/lib/constants';
import {
  googleHoursToWeekHours,
  parseAddressComponents,
  type PlaceDetails,
} from '@/lib/google-places';
import type { KosherKind } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type WizardState = {
  // Step 2 — Google
  googlePlaceId?: string;
  googleData?: PlaceDetails;
  // Step 3 — brand
  brandName: string;
  primaryCuisine: string;
  secondaryCuisines: string[];
  description: string;
  logoUrl: string | null;
  // Step 4 — location
  locationName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  hours: WeekHours;
  coverPhotoUrl: string | null;
  dietaryTags: string[];
  // Kosher cert (only when "Kosher" is in dietaryTags)
  kosherAgency: string;
  kosherAgencyOther: string;
  kosherType: KosherKind | '';
  kosherFlags: {
    glatt: boolean;
    cholov_yisroel: boolean;
    pas_yisroel: boolean;
    bishul_yisroel: boolean;
    yoshon: boolean;
    kosher_for_passover: boolean;
  };
  // Step 5 — quick menu items
  menuItems: { name: string; price: string; category: string }[];
};

const INITIAL: WizardState = {
  brandName: '',
  primaryCuisine: '',
  secondaryCuisines: [],
  description: '',
  logoUrl: null,
  locationName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  phone: '',
  latitude: null,
  longitude: null,
  hours: DEFAULT_HOURS,
  coverPhotoUrl: null,
  dietaryTags: [],
  kosherAgency: '',
  kosherAgencyOther: '',
  kosherType: '',
  kosherFlags: {
    glatt: false,
    cholov_yisroel: false,
    pas_yisroel: false,
    bishul_yisroel: false,
    yoshon: false,
    kosher_for_passover: false,
  },
  menuItems: [],
};

const STEP_LABELS = [
  'Welcome',
  'Find on Google',
  'Brand info',
  'First location',
  'Menu items',
  'Done',
];

export function OnboardingWizard({ userId }: { userId: string }) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [state, setState] = React.useState<WizardState>(INITIAL);
  const [savingFinal, setSavingFinal] = React.useState(false);
  const savingRef = React.useRef(false);

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function applyGooglePick(details: PlaceDetails) {
    const parts = parseAddressComponents(details.address_components);
    const hours = details.opening_hours?.periods
      ? (googleHoursToWeekHours(details.opening_hours.periods) as WeekHours)
      : state.hours;
    setState((prev) => ({
      ...prev,
      googlePlaceId: details.place_id,
      googleData: details,
      brandName: prev.brandName || details.name,
      locationName: prev.locationName || details.name,
      address: details.formatted_address ?? prev.address,
      city: parts.city ?? prev.city,
      state: parts.state ?? prev.state,
      zip: parts.zip ?? prev.zip,
      country: parts.country ?? prev.country,
      phone: details.formatted_phone_number ?? prev.phone,
      latitude: details.geometry?.location?.lat ?? prev.latitude,
      longitude: details.geometry?.location?.lng ?? prev.longitude,
      hours,
    }));
    toast.success(`Loaded "${details.name}" from Google`);
    setStep(2); // Jump to brand info
  }

  function next() {
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function validateBrand(): string | null {
    if (!state.brandName.trim()) return 'Brand name is required';
    if (!state.primaryCuisine) return 'Pick a primary cuisine';
    return null;
  }

  function validateLocation(): string | null {
    if (!state.address.trim()) return 'Address is required';
    if (state.dietaryTags.includes('Kosher') && !state.kosherAgency) {
      return 'Pick a kosher certifying agency';
    }
    return null;
  }

  /** Save everything in step 4 → DB. Run once when leaving step 4. */
  async function persistBrandAndLocation(): Promise<{
    brandId: string;
    locationId: string;
  } | null> {
    const supabase = createClient();
    // Brand
    const { data: brand, error: brandErr } = await supabase
      .from('brands')
      .insert({
        owner_id: userId,
        name: state.brandName.trim(),
        description: state.description || null,
        primary_cuisine: state.primaryCuisine,
        secondary_cuisines:
          state.secondaryCuisines.length > 0 ? state.secondaryCuisines : null,
        logo_url: state.logoUrl,
      })
      .select('id')
      .single();
    if (brandErr || !brand) {
      // Surface a clear message if the unique-owner constraint blocked us
      // (e.g. user opened onboarding in two tabs and finished both).
      const msg = brandErr?.message ?? 'unknown';
      const dup =
        brandErr?.code === '23505' || /duplicate key|unique/i.test(msg);
      if (dup) {
        toast.error(
          'You already have a brand on SeeIt. Each account can only manage one brand.',
        );
      } else {
        toast.error(`Could not save brand: ${msg}`);
      }
      return null;
    }

    // Location
    const { data: location, error: locErr } = await supabase
      .from('locations')
      .insert({
        brand_id: brand.id,
        name: state.locationName.trim() || state.brandName.trim(),
        address: state.address.trim(),
        city: state.city || null,
        state: state.state || null,
        zip: state.zip || null,
        country: state.country || null,
        phone: state.phone || null,
        latitude: state.latitude,
        longitude: state.longitude,
        hours: state.hours as any,
        cover_photo_url: state.coverPhotoUrl,
        dietary_tags:
          state.dietaryTags.length > 0 ? state.dietaryTags : null,
      })
      .select('id')
      .single();
    if (locErr || !location) {
      toast.error(
        `Could not save location: ${locErr?.message ?? 'unknown'}`,
      );
      return null;
    }

    // Kosher cert if applicable
    if (state.dietaryTags.includes('Kosher') && state.kosherAgency) {
      const finalAgency =
        state.kosherAgency === 'Other'
          ? state.kosherAgencyOther || 'Other'
          : state.kosherAgency;
      const { error: kosherErr } = await supabase
        .from('kosher_certifications')
        .insert({
          location_id: location.id,
          agency: finalAgency,
          agency_other:
            state.kosherAgency === 'Other'
              ? state.kosherAgencyOther || null
              : null,
          kosher_type: state.kosherType || null,
          is_glatt: state.kosherFlags.glatt,
          is_cholov_yisroel: state.kosherFlags.cholov_yisroel,
          is_pas_yisroel: state.kosherFlags.pas_yisroel,
          is_bishul_yisroel: state.kosherFlags.bishul_yisroel,
          is_yoshon: state.kosherFlags.yoshon,
          is_kosher_for_passover: state.kosherFlags.kosher_for_passover,
        });
      if (kosherErr) {
        // Non-fatal — surface but keep going
        toast.error(`Kosher cert: ${kosherErr.message}`);
      }
    }
    return { brandId: brand.id, locationId: location.id };
  }

  // We stash the created IDs so step 5 can attach menu items
  const [createdIds, setCreatedIds] = React.useState<{
    brandId: string;
    locationId: string;
  } | null>(null);

  async function handlePrimaryAction() {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      if (step === 0) {
        setStep(1);
      } else if (step === 1) {
        setStep(2);
      } else if (step === 2) {
        const err = validateBrand();
        if (err) {
          toast.error(err);
          return;
        }
        setStep(3);
      } else if (step === 3) {
        const err = validateLocation();
        if (err) {
          toast.error(err);
          return;
        }
        // Persist brand + location now so menu items get a real location_id.
        const ids = await persistBrandAndLocation();
        if (!ids) return;
        setCreatedIds(ids);
        setStep(4);
      } else if (step === 4) {
        // Optionally save menu items + advance
        await persistMenuItems();
        setStep(5);
      } else if (step === 5) {
        router.push('/dashboard');
        router.refresh();
      }
    } finally {
      savingRef.current = false;
    }
  }

  async function persistMenuItems() {
    if (!createdIds) return;
    const items = state.menuItems
      .map((i) => ({
        name: i.name.trim(),
        priceRaw: i.price.trim(),
        category: i.category.trim(),
      }))
      .filter((i) => i.name.length > 0);
    if (items.length === 0) return;

    setSavingFinal(true);
    const supabase = createClient();
    try {
      // Build categories on the fly (by name)
      const uniqueCategories = Array.from(
        new Set(items.map((i) => i.category).filter(Boolean)),
      );
      const catByName = new Map<string, string>();
      for (let i = 0; i < uniqueCategories.length; i++) {
        const name = uniqueCategories[i];
        const { data, error } = await supabase
          .from('menu_categories')
          .insert({
            location_id: createdIds.locationId,
            name,
            display_order: i + 1,
          })
          .select('id')
          .single();
        if (error || !data) {
          toast.error(`Category "${name}": ${error?.message ?? 'failed'}`);
          continue;
        }
        catByName.set(name.toLowerCase(), data.id);
      }

      const rows = items.map((i) => {
        const priceNum = i.priceRaw
          ? Number(i.priceRaw.replace(/[^0-9.]/g, ''))
          : null;
        return {
          location_id: createdIds.locationId,
          category_id: i.category
            ? catByName.get(i.category.toLowerCase()) ?? null
            : null,
          name: i.name,
          price: priceNum && !Number.isNaN(priceNum) ? priceNum : null,
          is_visible: true,
        };
      });
      const { error } = await supabase.from('menu_items').insert(rows);
      if (error) {
        toast.error(`Some menu items failed: ${error.message}`);
      } else {
        toast.success(`Added ${rows.length} menu item${rows.length === 1 ? '' : 's'}`);
      }
    } finally {
      setSavingFinal(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo size="md" />
          <p className="text-[12px] text-muted-foreground">
            Step {step + 1} of {STEP_LABELS.length}
          </p>
        </div>
        <div className="h-1 w-full bg-warm-100">
          <div
            className="h-1 bg-terracotta-500 transition-all"
            style={{
              width: `${((step + 1) / STEP_LABELS.length) * 100}%`,
            }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {step === 0 && <StepWelcome />}
        {step === 1 && (
          <StepGoogle
            onPick={applyGooglePick}
            onSkip={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepBrand state={state} update={update} userId={userId} />
        )}
        {step === 3 && (
          <StepLocation state={state} update={update} userId={userId} />
        )}
        {step === 4 && (
          <StepMenuItems
            items={state.menuItems}
            onChange={(items) => update('menuItems', items)}
          />
        )}
        {step === 5 && <StepDone brandName={state.brandName} />}

        <div className="mt-8 flex flex-col-reverse items-stretch justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            {step > 0 && step < 5 && (
              <Button
                type="button"
                variant="ghost"
                onClick={prev}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {step === 4 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(5)}
                className="text-muted-foreground"
              >
                Skip — I'll add later
              </Button>
            )}
            <Button
              type="button"
              size="lg"
              onClick={handlePrimaryAction}
              disabled={savingFinal}
              className="gap-1.5"
            >
              {savingFinal ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : step === 0 ? (
                <>
                  Continue <ArrowRight className="h-4 w-4" />
                </>
              ) : step === 5 ? (
                <>
                  Go to dashboard <ArrowRight className="h-4 w-4" />
                </>
              ) : step === 3 ? (
                <>
                  Save and continue <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Steps
// ─────────────────────────────────────────────────────────────────────────

function StepWelcome() {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-terracotta-50 text-terracotta-600">
        <UtensilsCrossed className="h-7 w-7" />
      </div>
      <div>
        <h1 className="text-[28px] font-bold tracking-tight">
          Add your first restaurant on SeeIt
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[14.5px] text-muted-foreground">
          We'll walk you through six quick steps — connect Google to pre-fill
          most fields, or enter everything by hand. You can edit anything
          later from the dashboard.
        </p>
      </div>
      <ul className="mx-auto max-w-md space-y-2 text-left">
        {[
          'Connect Google to import your business info',
          'Set up your brand and first location',
          'Add a few menu items to get started',
        ].map((line) => (
          <li
            key={line}
            className="flex items-start gap-2 text-[14px] text-foreground"
          >
            <Check className="mt-0.5 h-4 w-4 text-terracotta-500" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepGoogle({
  onPick,
  onSkip,
}: {
  onPick: (d: PlaceDetails) => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[22px] font-bold tracking-tight">
          Find your restaurant on Google
        </h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          We'll pull your address, phone, hours, and rating — so you don't
          have to retype them. Skip if you'd rather enter manually.
        </p>
      </div>
      <GooglePlaceSearch onPick={onPick} />
      <div className="flex justify-center">
        <Button
          type="button"
          variant="link"
          onClick={onSkip}
          className="text-muted-foreground"
        >
          Skip — enter manually
        </Button>
      </div>
    </div>
  );
}

function StepBrand({
  state,
  update,
  userId,
}: {
  state: WizardState;
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  userId: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[22px] font-bold tracking-tight">
          Tell us about your brand
        </h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          This is the umbrella name customers will see. You can add more
          locations under it later.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="brand-name">Brand name *</Label>
        <Input
          id="brand-name"
          value={state.brandName}
          onChange={(e) => update('brandName', e.target.value)}
          placeholder="Mendel's Kitchen"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="primary-cuisine">Primary cuisine *</Label>
        <Select
          value={state.primaryCuisine}
          onValueChange={(v) => update('primaryCuisine', v)}
        >
          <SelectTrigger id="primary-cuisine">
            <SelectValue placeholder="Pick one…" />
          </SelectTrigger>
          <SelectContent>
            {CUISINE_GROUPS.map((g) => (
              <SelectGroup key={g.label}>
                <SelectLabel>{g.label}</SelectLabel>
                {g.options.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Secondary cuisines</Label>
        <MultiSelect
          options={PRIMARY_CUISINES}
          value={state.secondaryCuisines}
          onChange={(v) => update('secondaryCuisines', v)}
          placeholder="Pick a few that fit…"
        />
        <p className="text-[11.5px] text-muted-foreground">
          Optional — helps customers find you in searches.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="brand-desc">Description</Label>
        <Textarea
          id="brand-desc"
          rows={3}
          value={state.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="A short pitch — what makes you different?"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Logo</Label>
        <PhotoUpload
          bucket={STORAGE.RESTAURANT_PHOTOS}
          prefix={`brand-logos/${userId}`}
          value={state.logoUrl}
          onChange={(url) => update('logoUrl', url)}
        />
      </div>
    </div>
  );
}

function StepLocation({
  state,
  update,
  userId,
}: {
  state: WizardState;
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  userId: string;
}) {
  const showsKosher = state.dietaryTags.includes('Kosher');
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[22px] font-bold tracking-tight">
          Add your first location
        </h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          We'll start with one — you can add more from the Locations tab.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="loc-name">Location name</Label>
        <Input
          id="loc-name"
          value={state.locationName}
          onChange={(e) => update('locationName', e.target.value)}
          placeholder={state.brandName || 'Main location'}
        />
        <p className="text-[11.5px] text-muted-foreground">
          E.g. "Brooklyn" or "Crown Heights". Defaults to your brand name.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="loc-addr">Street address *</Label>
        <Input
          id="loc-addr"
          value={state.address}
          onChange={(e) => update('address', e.target.value)}
          placeholder="123 Main St"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="loc-city">City</Label>
          <Input
            id="loc-city"
            value={state.city}
            onChange={(e) => update('city', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="loc-state">State / Region</Label>
          <Input
            id="loc-state"
            value={state.state}
            onChange={(e) => update('state', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="loc-zip">ZIP / Postal code</Label>
          <Input
            id="loc-zip"
            value={state.zip}
            onChange={(e) => update('zip', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="loc-country">Country</Label>
          <Input
            id="loc-country"
            value={state.country}
            onChange={(e) => update('country', e.target.value)}
            placeholder="US"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="loc-phone">Phone</Label>
        <Input
          id="loc-phone"
          value={state.phone}
          onChange={(e) => update('phone', e.target.value)}
          placeholder="(718) 555-1234"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Hours</Label>
        <HoursEditor
          value={state.hours}
          onChange={(v) => update('hours', v)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Cover photo</Label>
        <PhotoUpload
          bucket={STORAGE.RESTAURANT_PHOTOS}
          prefix={`location-covers/${userId}`}
          value={state.coverPhotoUrl}
          onChange={(url) => update('coverPhotoUrl', url)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Dietary tags</Label>
        <MultiSelect
          options={DIETARY_TAGS}
          value={state.dietaryTags}
          onChange={(v) => update('dietaryTags', v)}
          placeholder="Kosher, Halal, Vegan…"
        />
      </div>

      {showsKosher && (
        <div className="space-y-4 rounded-xl border border-terracotta-100 bg-terracotta-50/40 p-4">
          <div>
            <p className="font-semibold">Kosher certification</p>
            <p className="text-[12.5px] text-muted-foreground">
              We require this for the Kosher tag so customers can trust the
              listing.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kosher-agency">Certifying agency *</Label>
            <Select
              value={state.kosherAgency}
              onValueChange={(v) => update('kosherAgency', v)}
            >
              <SelectTrigger id="kosher-agency">
                <SelectValue placeholder="Pick an agency…" />
              </SelectTrigger>
              <SelectContent>
                {KOSHER_AGENCIES.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {state.kosherAgency === 'Other' && (
            <div className="space-y-1.5">
              <Label htmlFor="kosher-other">Agency name</Label>
              <Input
                id="kosher-other"
                value={state.kosherAgencyOther}
                onChange={(e) => update('kosherAgencyOther', e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="kosher-type">Kosher type</Label>
            <Select
              value={state.kosherType}
              onValueChange={(v) =>
                update('kosherType', v as KosherKind)
              }
            >
              <SelectTrigger id="kosher-type">
                <SelectValue placeholder="Pick…" />
              </SelectTrigger>
              <SelectContent>
                {KOSHER_TYPES.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['glatt', 'Glatt'],
                ['cholov_yisroel', 'Cholov Yisroel'],
                ['pas_yisroel', 'Pas Yisroel'],
                ['bishul_yisroel', 'Bishul Yisroel'],
                ['yoshon', 'Yoshon'],
                ['kosher_for_passover', 'Kosher for Passover'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px]"
              >
                <Checkbox
                  checked={state.kosherFlags[key]}
                  onCheckedChange={(c) =>
                    update('kosherFlags', {
                      ...state.kosherFlags,
                      [key]: !!c,
                    })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepMenuItems({
  items,
  onChange,
}: {
  items: WizardState['menuItems'];
  onChange: (items: WizardState['menuItems']) => void;
}) {
  const canAdd = items.length < 5;

  function add() {
    onChange([...items, { name: '', price: '', category: '' }]);
  }
  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }
  function patch(idx: number, patch: Partial<WizardState['menuItems'][number]>) {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[22px] font-bold tracking-tight">
          Add a few menu items
        </h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Just the basics — name, price, category. You can flesh them out
          with photos and descriptions later. (Up to 5 to start.)
        </p>
      </div>

      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-warm-50/40 p-8 text-center">
          <Utensils className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold">
            No items yet — totally fine
          </p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Add a few now or skip and use the full Menu editor later.
          </p>
          <Button
            type="button"
            onClick={add}
            className="mt-4 gap-1.5"
            variant="outline"
          >
            <Plus className="h-4 w-4" /> Add first item
          </Button>
        </div>
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li
              key={i}
              className="rounded-xl border border-border bg-card p-3"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_140px_auto]">
                <Input
                  value={item.name}
                  onChange={(e) => patch(i, { name: e.target.value })}
                  placeholder="Dish name"
                />
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={item.price}
                  onChange={(e) => patch(i, { price: e.target.value })}
                  placeholder="Price"
                />
                <Input
                  value={item.category}
                  onChange={(e) => patch(i, { category: e.target.value })}
                  placeholder="Category (e.g. Mains)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                  aria-label="Remove item"
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canAdd && items.length > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={add}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add another
        </Button>
      )}
    </div>
  );
}

function StepDone({ brandName }: { brandName: string }) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <div>
        <h1 className="text-[28px] font-bold tracking-tight">You're all set!</h1>
        <p className="mx-auto mt-2 max-w-md text-[14.5px] text-muted-foreground">
          {brandName ? `${brandName} is live on your dashboard.` : 'Your restaurant is live on your dashboard.'}{' '}
          From here you can add more locations, polish your menu, respond to
          reviews, and track how customers find you.
        </p>
      </div>
      <Link
        href="/dashboard"
        className={cn(
          'inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-soft hover:bg-terracotta-600 hover:shadow-soft-md',
        )}
      >
        <Sparkles className="h-4 w-4" /> Go to my dashboard
      </Link>
    </div>
  );
}
