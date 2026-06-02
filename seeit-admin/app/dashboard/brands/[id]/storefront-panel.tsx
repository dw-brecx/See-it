'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Facebook,
  Globe,
  Instagram,
  Loader2,
  MessageSquare,
  Palette,
  Sparkles,
  Star,
  Twitter,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PhotoUpload } from '@/components/PhotoUpload';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { STORAGE } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { cn, initials } from '@/lib/utils';

const TikTokIcon = ({ className }: { className?: string }) => (
  // Lucide doesn't ship a TikTok glyph; minimal inline SVG so we don't pull a dep.
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
    className={className}
  >
    <path d="M19.5 7.7a6.7 6.7 0 0 1-4.2-1.5v8.5a5.7 5.7 0 1 1-5.7-5.7h.5v2.9a2.8 2.8 0 1 0 2.4 2.8V2h2.8a4 4 0 0 0 4 4Z" />
  </svg>
);

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const schema = z.object({
  tagline: z.string().max(140).optional().or(z.literal('')),
  cover_photo_url: z.string().optional().nullable().or(z.literal('')),
  story: z.string().max(4000).optional().or(z.literal('')),
  website_url: z.string().url('Must be a full URL (https://…)').optional().or(z.literal('')),
  instagram_url: z.string().url('Must be a full URL').optional().or(z.literal('')),
  tiktok_url: z.string().url('Must be a full URL').optional().or(z.literal('')),
  facebook_url: z.string().url('Must be a full URL').optional().or(z.literal('')),
  x_url: z.string().url('Must be a full URL').optional().or(z.literal('')),
  theme_color: z
    .string()
    .regex(HEX, 'Use a hex color like #E85D3A')
    .optional()
    .or(z.literal('')),
  featured_menu_item_ids: z.array(z.string()).default([]),
  storefront_published: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

type Brand = {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  primary_cuisine: string | null;
  tagline: string | null;
  cover_photo_url: string | null;
  story: string | null;
  website_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  x_url: string | null;
  theme_color: string | null;
  featured_menu_item_ids: string[] | null;
  storefront_published: boolean | null;
};

type MenuItemOption = {
  id: string;
  name: string;
  location_name?: string;
};

type Props = {
  brand: Brand;
  menuItems: MenuItemOption[];
};

export function StorefrontPanel({ brand, menuItems }: Props) {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tagline: brand.tagline ?? '',
      cover_photo_url: brand.cover_photo_url ?? '',
      story: brand.story ?? '',
      website_url: brand.website_url ?? '',
      instagram_url: brand.instagram_url ?? '',
      tiktok_url: brand.tiktok_url ?? '',
      facebook_url: brand.facebook_url ?? '',
      x_url: brand.x_url ?? '',
      theme_color: brand.theme_color ?? '',
      featured_menu_item_ids: brand.featured_menu_item_ids ?? [],
      storefront_published: brand.storefront_published ?? true,
    },
  });

  const submittingRef = React.useRef(false);
  const watched = form.watch();

  async function onSubmit(values: FormValues) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const supabase = createClient();
      const payload = {
        tagline: values.tagline || null,
        cover_photo_url: values.cover_photo_url || null,
        story: values.story || null,
        website_url: values.website_url || null,
        instagram_url: values.instagram_url || null,
        tiktok_url: values.tiktok_url || null,
        facebook_url: values.facebook_url || null,
        x_url: values.x_url || null,
        theme_color: values.theme_color || null,
        featured_menu_item_ids: values.featured_menu_item_ids,
        storefront_published: values.storefront_published,
      };
      const { error } = await supabase.from('brands').update(payload).eq('id', brand.id);
      if (error) {
        toast.error(`Save failed: ${error.message}`);
        return;
      }
      toast.success('Storefront updated');
      router.refresh();
    } finally {
      submittingRef.current = false;
    }
  }

  const themeColor: string | null = HEX.test(watched.theme_color ?? '')
    ? (watched.theme_color ?? null)
    : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      {/* Editor */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Identity */}
          <Card>
            <CardHeader>
              <div className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>Storefront identity</CardTitle>
                  <CardDescription>
                    How this store appears in the customer app.
                  </CardDescription>
                </div>
                <FormField
                  control={form.control}
                  name="storefront_published"
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-xs text-muted-foreground">
                        {field.value ? 'Live' : 'Hidden'}
                      </FormLabel>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="cover_photo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover photo (hero banner)</FormLabel>
                    <FormControl>
                      <PhotoUpload
                        bucket={STORAGE.RESTAURANT_PHOTOS}
                        prefix={`storefronts/${brand.id}`}
                        value={field.value || null}
                        onChange={(url) => field.onChange(url ?? '')}
                      />
                    </FormControl>
                    <FormDescription>
                      Shown big and wide at the top of the public profile. Use a
                      photo that captures the vibe — interior, signature dish, or
                      busy dining room.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="The best pasta in Brooklyn since 2008"
                        maxLength={140}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      One-liner shown under the store name. Max 140 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="story"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Our story</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder="Who you are, why you started, what makes the food worth coming back for…"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Longer "about us" section. Markdown not supported yet.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="theme_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={
                              HEX.test(field.value ?? '')
                                ? field.value!
                                : '#E85D3A'
                            }
                            onChange={(e) => field.onChange(e.target.value)}
                            className="h-10 w-12 cursor-pointer rounded-lg border border-input bg-card p-1"
                            aria-label="Pick theme color"
                          />
                        </div>
                        <Input
                          placeholder="#E85D3A"
                          {...field}
                          className="font-mono"
                        />
                        {field.value && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => field.onChange('')}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Accent color used across the store's customer-facing pages.
                      Defaults to SeeIt terracotta when unset.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Featured items */}
          <Card>
            <CardHeader>
              <CardTitle>Featured menu items</CardTitle>
              <CardDescription>
                Pinned to the top of the customer's view. Pick a few standouts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="featured_menu_item_ids"
                render={({ field }) => {
                  const selected = new Set(field.value ?? []);
                  const max = 6;
                  function toggle(id: string) {
                    const next = new Set(selected);
                    if (next.has(id)) next.delete(id);
                    else if (next.size < max) next.add(id);
                    field.onChange(Array.from(next));
                  }
                  if (menuItems.length === 0) {
                    return (
                      <FormItem>
                        <p className="rounded-lg border border-dashed border-border bg-warm-50/60 px-4 py-6 text-center text-[13px] text-muted-foreground">
                          Add menu items to a location first, then come back to feature them here.
                        </p>
                      </FormItem>
                    );
                  }
                  return (
                    <FormItem>
                      <p className="mb-2 text-[12px] text-muted-foreground">
                        {selected.size} / {max} selected
                      </p>
                      <div className="grid max-h-72 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                        {menuItems.map((m) => {
                          const isOn = selected.has(m.id);
                          const disabled = !isOn && selected.size >= max;
                          return (
                            <label
                              key={m.id}
                              className={cn(
                                'flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-[13px] transition-colors',
                                isOn
                                  ? 'border-terracotta-200 bg-terracotta-50/70 text-terracotta-800'
                                  : 'border-border bg-card hover:border-warm-300 hover:bg-warm-50',
                                disabled && 'cursor-not-allowed opacity-50',
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isOn}
                                onChange={() => toggle(m.id)}
                                disabled={disabled}
                                className="h-3.5 w-3.5 accent-terracotta-500"
                              />
                              <span className="min-w-0 flex-1 truncate">
                                <span className="font-medium">{m.name}</span>
                                {m.location_name && (
                                  <span className="ml-1 text-[11px] text-muted-foreground">
                                    · {m.location_name}
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </CardContent>
          </Card>

          {/* Social links */}
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
                  { name: 'website_url', label: 'Website', icon: Globe, placeholder: 'https://example.com' },
                  { name: 'instagram_url', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/handle' },
                  { name: 'tiktok_url', label: 'TikTok', icon: TikTokIcon, placeholder: 'https://tiktok.com/@handle' },
                  { name: 'facebook_url', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/page' },
                  { name: 'x_url', label: 'X (Twitter)', icon: Twitter, placeholder: 'https://x.com/handle' },
                ] as const
              ).map((it) => {
                const Icon = it.icon;
                return (
                  <FormField
                    key={it.name}
                    control={form.control}
                    name={it.name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {it.label}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder={it.placeholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}
            </CardContent>
          </Card>

          <div className="sticky bottom-3 z-10 flex justify-end gap-2 rounded-xl border border-border bg-card/95 p-3 shadow-soft backdrop-blur">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                form.reset({
                  tagline: brand.tagline ?? '',
                  cover_photo_url: brand.cover_photo_url ?? '',
                  story: brand.story ?? '',
                  website_url: brand.website_url ?? '',
                  instagram_url: brand.instagram_url ?? '',
                  tiktok_url: brand.tiktok_url ?? '',
                  facebook_url: brand.facebook_url ?? '',
                  x_url: brand.x_url ?? '',
                  theme_color: brand.theme_color ?? '',
                  featured_menu_item_ids: brand.featured_menu_item_ids ?? [],
                  storefront_published: brand.storefront_published ?? true,
                })
              }
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !form.formState.isDirty}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                'Save storefront'
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Live preview */}
      <div className="lg:sticky lg:top-[88px] lg:h-fit">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-terracotta-500" />
              Live preview
            </CardTitle>
            {watched.storefront_published ? (
              <Badge variant="success">
                <Eye className="h-3 w-3" /> Visible
              </Badge>
            ) : (
              <Badge variant="warning">
                <EyeOff className="h-3 w-3" /> Hidden
              </Badge>
            )}
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="border-t border-border">
              {/* Hero with cover photo + theme color tint */}
              <div
                className="relative h-44 w-full bg-warm-100"
                style={{
                  backgroundImage: watched.cover_photo_url
                    ? `url(${watched.cover_photo_url})`
                    : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: themeColor
                      ? `linear-gradient(180deg, transparent 40%, ${themeColor}cc 100%)`
                      : 'linear-gradient(180deg, transparent 40%, rgba(28,25,21,0.6) 100%)',
                  }}
                />
                {!watched.cover_photo_url && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <span className="text-xs">Add a cover photo</span>
                  </div>
                )}
              </div>

              <div className="relative -mt-10 px-5 pb-5">
                <Avatar className="h-20 w-20 rounded-2xl border-4 border-card shadow-soft-md">
                  {brand.logo_url ? (
                    <AvatarImage src={brand.logo_url} alt={brand.name} />
                  ) : null}
                  <AvatarFallback
                    className="rounded-2xl text-xl font-bold"
                    style={
                      themeColor
                        ? { backgroundColor: themeColor + '20', color: themeColor }
                        : undefined
                    }
                  >
                    {initials(brand.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-3 space-y-1">
                  <h3 className="text-xl font-bold tracking-tight">
                    {brand.name}
                  </h3>
                  {watched.tagline && (
                    <p
                      className="text-[14px] font-medium"
                      style={
                        themeColor ? { color: themeColor } : { color: 'var(--tw-prose-headings)' }
                      }
                    >
                      {watched.tagline}
                    </p>
                  )}
                  {brand.primary_cuisine && (
                    <p className="text-[12.5px] text-muted-foreground">
                      {brand.primary_cuisine}
                    </p>
                  )}
                </div>

                {/* Story */}
                {watched.story && (
                  <p className="mt-4 whitespace-pre-line text-[13px] leading-relaxed text-foreground/85 line-clamp-6">
                    {watched.story}
                  </p>
                )}

                {/* Links row */}
                {[
                  watched.website_url,
                  watched.instagram_url,
                  watched.tiktok_url,
                  watched.facebook_url,
                  watched.x_url,
                ].some(Boolean) && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {watched.website_url && (
                      <PreviewIconLink href={watched.website_url} themeColor={themeColor}>
                        <Globe className="h-3.5 w-3.5" />
                      </PreviewIconLink>
                    )}
                    {watched.instagram_url && (
                      <PreviewIconLink href={watched.instagram_url} themeColor={themeColor}>
                        <Instagram className="h-3.5 w-3.5" />
                      </PreviewIconLink>
                    )}
                    {watched.tiktok_url && (
                      <PreviewIconLink href={watched.tiktok_url} themeColor={themeColor}>
                        <TikTokIcon className="h-3.5 w-3.5" />
                      </PreviewIconLink>
                    )}
                    {watched.facebook_url && (
                      <PreviewIconLink href={watched.facebook_url} themeColor={themeColor}>
                        <Facebook className="h-3.5 w-3.5" />
                      </PreviewIconLink>
                    )}
                    {watched.x_url && (
                      <PreviewIconLink href={watched.x_url} themeColor={themeColor}>
                        <Twitter className="h-3.5 w-3.5" />
                      </PreviewIconLink>
                    )}
                  </div>
                )}

                {/* Featured items */}
                {watched.featured_menu_item_ids && watched.featured_menu_item_ids.length > 0 && (
                  <div className="mt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Featured
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {watched.featured_menu_item_ids.slice(0, 6).map((id) => {
                        const item = menuItems.find((m) => m.id === id);
                        if (!item) return null;
                        return (
                          <li
                            key={id}
                            className="flex items-center gap-2 rounded-md bg-warm-50 px-2.5 py-1.5"
                          >
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span className="text-[12.5px] font-medium">
                              {item.name}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PreviewIconLink({
  href,
  children,
  themeColor,
}: {
  href: string;
  children: React.ReactNode;
  themeColor: string | null;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-warm-100 hover:text-foreground"
      style={
        themeColor
          ? { color: themeColor, borderColor: themeColor + '40' }
          : undefined
      }
    >
      {children}
    </a>
  );
}
