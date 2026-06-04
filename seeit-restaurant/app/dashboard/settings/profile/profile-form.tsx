'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Facebook,
  Globe,
  Instagram,
  Loader2,
  Twitter,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBrand } from '@/components/BrandContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/MultiSelect';
import { PhotoUpload } from '@/components/PhotoUpload';
import { EmptyState } from '@/components/EmptyState';
import { CUISINE_GROUPS, PRIMARY_CUISINES, STORAGE } from '@/lib/constants';
import { Building2 } from 'lucide-react';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M19.5 7.7a6.7 6.7 0 0 1-4.2-1.5v8.5a5.7 5.7 0 1 1-5.7-5.7h.5v2.9a2.8 2.8 0 1 0 2.4 2.8V2h2.8a4 4 0 0 0 4 4Z" />
  </svg>
);

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

type BrandRow = {
  id: string;
  name: string;
  description: string | null;
  tagline: string | null;
  story: string | null;
  primary_cuisine: string | null;
  secondary_cuisines: string[] | null;
  logo_url: string | null;
  cover_photo_url: string | null;
  theme_color: string | null;
  website_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  x_url: string | null;
  storefront_published: boolean | null;
};

type FormState = {
  name: string;
  tagline: string;
  description: string;
  story: string;
  primary_cuisine: string;
  secondary_cuisines: string[];
  logo_url: string;
  cover_photo_url: string;
  theme_color: string;
  website_url: string;
  instagram_url: string;
  tiktok_url: string;
  facebook_url: string;
  x_url: string;
  storefront_published: boolean;
};

function brandToForm(b: BrandRow): FormState {
  return {
    name: b.name ?? '',
    tagline: b.tagline ?? '',
    description: b.description ?? '',
    story: b.story ?? '',
    primary_cuisine: b.primary_cuisine ?? '',
    secondary_cuisines: b.secondary_cuisines ?? [],
    logo_url: b.logo_url ?? '',
    cover_photo_url: b.cover_photo_url ?? '',
    theme_color: b.theme_color ?? '',
    website_url: b.website_url ?? '',
    instagram_url: b.instagram_url ?? '',
    tiktok_url: b.tiktok_url ?? '',
    facebook_url: b.facebook_url ?? '',
    x_url: b.x_url ?? '',
    storefront_published: b.storefront_published ?? true,
  };
}

export function ProfileForm() {
  const router = useRouter();
  const { currentBrandId, currentBrand } = useBrand();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [brand, setBrand] = React.useState<BrandRow | null>(null);
  const [form, setForm] = React.useState<FormState | null>(null);
  const submittingRef = React.useRef(false);

  React.useEffect(() => {
    if (!currentBrandId) {
      setLoading(false);
      setBrand(null);
      setForm(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const supabase = createClient();
      // Use `*` so the fetch tolerates schemas missing newer storefront columns
      // (e.g. when migration 003 hasn't been run). Missing columns just come
      // back as undefined and brandToForm coalesces to empty strings.
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', currentBrandId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error(`Failed to load store: ${error.message}`);
        setBrand(null);
        setForm(null);
      } else if (data) {
        setBrand(data as any);
        setForm(brandToForm(data as any));
      } else {
        // Brand row not visible — likely RLS or stale brand id. Surface it
        // instead of silently dropping into a "Loading store…" forever state.
        toast.error(
          'Could not load your store. Sign out and back in, or contact support.',
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentBrandId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!form || !currentBrandId) return;
    if (!form.name.trim()) {
      toast.error('Store name is required');
      return;
    }
    if (form.theme_color && !HEX.test(form.theme_color)) {
      toast.error('Theme color must be a hex like #E85D3A');
      return;
    }
    submittingRef.current = true;
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        name: form.name.trim(),
        tagline: form.tagline.trim() || null,
        description: form.description.trim() || null,
        story: form.story.trim() || null,
        primary_cuisine: form.primary_cuisine || null,
        secondary_cuisines: form.secondary_cuisines,
        logo_url: form.logo_url || null,
        cover_photo_url: form.cover_photo_url || null,
        theme_color: form.theme_color || null,
        website_url: form.website_url.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        tiktok_url: form.tiktok_url.trim() || null,
        facebook_url: form.facebook_url.trim() || null,
        x_url: form.x_url.trim() || null,
        storefront_published: form.storefront_published,
      };
      const { error } = await supabase
        .from('brands')
        .update(payload)
        .eq('id', currentBrandId);
      if (error) {
        toast.error(`Save failed: ${error.message}`);
        return;
      }
      toast.success('Store profile saved');
      setBrand((prev) => (prev ? { ...prev, ...payload } : prev));
      router.refresh();
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // No brand context at all — middleware should have redirected to /onboarding,
  // but if we somehow render here (e.g. signed-in admin browsing), show a quiet
  // placeholder instead of a deceptive "Loading…" spinner.
  if (!currentBrandId) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Building2}
            title="No store on this account"
            description="Finish onboarding to create your store, or sign in with the account that owns the store."
          />
        </CardContent>
      </Card>
    );
  }

  // Fetch finished but no row came back — surface a real error with a retry,
  // not a perpetual loading state.
  if (!brand || !form) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-[14px] font-semibold">
            We couldn't load your store
          </p>
          <p className="text-[12.5px] text-muted-foreground">
            This usually means a database migration hasn't been run, or your
            session is stale. Try refreshing — if that doesn't work, sign out
            and back in.
          </p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-terracotta-500 px-3 py-2 text-[13px] font-semibold text-white hover:bg-terracotta-600"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  const themeColor = HEX.test(form.theme_color) ? form.theme_color : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Visibility */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Visibility</CardTitle>
              <CardDescription>
                When live, this brand and its locations appear in customer search.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {form.storefront_published ? (
                <Badge variant="success">
                  <Eye className="h-3 w-3" /> Live
                </Badge>
              ) : (
                <Badge variant="warning">
                  <EyeOff className="h-3 w-3" /> Hidden
                </Badge>
              )}
              <Switch
                checked={form.storefront_published}
                onCheckedChange={(v) => set('storefront_published', v)}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>Name, tagline, cuisine, and your story.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Store name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Bella's Italian Kitchen"
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={form.tagline}
              onChange={(e) => set('tagline', e.target.value)}
              placeholder="The best pasta in Brooklyn since 2008"
              maxLength={60}
              className="mt-1.5"
            />
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              {form.tagline.length} / 60 — shown under the store name.
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="A short blurb shown across the customer app."
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="story">Our story</Label>
            <Textarea
              id="story"
              value={form.story}
              onChange={(e) => set('story', e.target.value)}
              rows={6}
              maxLength={1500}
              placeholder="Who you are, why you started, what makes the food worth coming back for…"
              className="mt-1.5"
            />
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              {form.story.length} / 1500
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Primary cuisine</Label>
              <Select
                value={form.primary_cuisine}
                onValueChange={(v) => set('primary_cuisine', v)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Pick a cuisine" />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh]">
                  {CUISINE_GROUPS.map((group, idx) => (
                    <SelectGroup key={group.label}>
                      {idx > 0 && <SelectSeparator />}
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.options.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Secondary cuisines</Label>
              <div className="mt-1.5">
                <MultiSelect
                  options={PRIMARY_CUISINES}
                  value={form.secondary_cuisines}
                  onChange={(v) => set('secondary_cuisines', v)}
                  placeholder="Pick any extras"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visuals */}
      <Card>
        <CardHeader>
          <CardTitle>Visuals</CardTitle>
          <CardDescription>
            Logo, hero image, and theme color used on your storefront.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Logo</Label>
              <div className="mt-1.5">
                <PhotoUpload
                  bucket={STORAGE.RESTAURANT_PHOTOS}
                  prefix={`brand-logos/${brand.id}`}
                  value={form.logo_url || null}
                  onChange={(url) => set('logo_url', url ?? '')}
                />
              </div>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                Square, 200×200 px minimum.
              </p>
            </div>

            <div>
              <Label>Cover photo</Label>
              <div className="mt-1.5">
                <PhotoUpload
                  bucket={STORAGE.RESTAURANT_PHOTOS}
                  prefix={`storefronts/${brand.id}`}
                  value={form.cover_photo_url || null}
                  onChange={(url) => set('cover_photo_url', url ?? '')}
                />
              </div>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                Wide hero — interior, signature dish, or busy dining room.
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="theme_color">Theme color</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                value={HEX.test(form.theme_color) ? form.theme_color : '#E85D3A'}
                onChange={(e) => set('theme_color', e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-lg border border-input bg-card p-1"
                aria-label="Pick theme color"
              />
              <Input
                id="theme_color"
                value={form.theme_color}
                onChange={(e) => set('theme_color', e.target.value)}
                placeholder="#E85D3A"
                className="font-mono"
              />
              {form.theme_color && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => set('theme_color', '')}
                >
                  Clear
                </Button>
              )}
            </div>
            {themeColor && (
              <div
                className="mt-2 h-2 w-full rounded-full"
                style={{ backgroundColor: themeColor }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social */}
      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
          <CardDescription>
            Shown as icon buttons on the storefront. Leave blank to hide.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              { name: 'website_url' as const, label: 'Website', icon: Globe, placeholder: 'https://example.com' },
              { name: 'instagram_url' as const, label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/handle' },
              { name: 'tiktok_url' as const, label: 'TikTok', icon: TikTokIcon, placeholder: 'https://tiktok.com/@handle' },
              { name: 'facebook_url' as const, label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/page' },
              { name: 'x_url' as const, label: 'X (Twitter)', icon: Twitter, placeholder: 'https://x.com/handle' },
            ]
          ).map((it) => {
            const Icon = it.icon;
            return (
              <div key={it.name}>
                <Label className="flex items-center gap-2" htmlFor={it.name}>
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {it.label}
                </Label>
                <Input
                  id={it.name}
                  type="url"
                  value={form[it.name]}
                  onChange={(e) => set(it.name, e.target.value)}
                  placeholder={it.placeholder}
                  className="mt-1.5"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="sticky bottom-3 z-10 flex justify-end gap-2 rounded-xl border border-border bg-card/95 p-3 shadow-soft backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={() => brand && setForm(brandToForm(brand))}
          disabled={saving}
        >
          Reset
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </div>

      {currentBrand && (
        <p className="text-[11.5px] text-muted-foreground">
          Editing <span className="font-medium">{currentBrand.name}</span>
        </p>
      )}
    </form>
  );
}
