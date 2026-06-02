'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Clock,
  Facebook,
  Globe,
  Instagram,
  MapPin,
  Phone,
  Star,
  Twitter,
  Utensils,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, initials, formatRelative } from '@/lib/utils';
import { WEEKDAYS, type WeekHours } from '@/lib/constants';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M19.5 7.7a6.7 6.7 0 0 1-4.2-1.5v8.5a5.7 5.7 0 1 1-5.7-5.7h.5v2.9a2.8 2.8 0 1 0 2.4 2.8V2h2.8a4 4 0 0 0 4 4Z" />
  </svg>
);

export type StorefrontBrand = {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  primary_cuisine: string | null;
  secondary_cuisines: string[] | null;
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

export type StorefrontLocation = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  cover_photo_url: string | null;
  dietary_tags: string[] | null;
  average_rating: number | null;
  review_count: number | null;
  is_temporarily_closed: boolean | null;
  hours: WeekHours | null;
};

export type StorefrontFeaturedItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  dietary_tags: string[] | null;
  photo_url: string | null;
};

export type StorefrontReview = {
  id: string;
  rating: number;
  text: string | null;
  created_at: string;
  reviewer_name: string;
  reviewer_avatar_url: string | null;
  location_name: string | null;
};

type Props = {
  brand: StorefrontBrand;
  locations: StorefrontLocation[];
  featuredItems: StorefrontFeaturedItem[];
  recentReviews: StorefrontReview[];
  /** True when shown inside the dashboard preview wrapper — adds a tiny "Preview" chip overlay. */
  isPreview?: boolean;
};

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function StorefrontPreview({
  brand,
  locations,
  featuredItems,
  recentReviews,
  isPreview = false,
}: Props) {
  const themeColor = HEX.test(brand.theme_color ?? '') ? brand.theme_color! : null;
  const accent = themeColor ?? '#E85D3A';

  const today = new Date().getDay(); // 0 = Sun
  const weekdayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][today];

  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      {/* Hero */}
      <div className="relative h-56 w-full bg-warm-100 sm:h-72">
        {brand.cover_photo_url ? (
          <Image
            src={brand.cover_photo_url}
            alt={brand.name}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No cover photo yet
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 30%, ${accent}cc 100%)`,
          }}
        />
        {isPreview && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/40 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
            Preview
          </div>
        )}
        {brand.storefront_published === false && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/95 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-amber-800 backdrop-blur-sm">
            Hidden from customers
          </div>
        )}
      </div>

      {/* Identity */}
      <div className="relative -mt-12 px-5 pb-5 sm:px-7">
        <Avatar className="h-24 w-24 rounded-2xl border-4 border-card shadow-soft-md">
          {brand.logo_url ? <AvatarImage src={brand.logo_url} alt={brand.name} /> : null}
          <AvatarFallback
            className="rounded-2xl text-2xl font-bold"
            style={{ backgroundColor: accent + '20', color: accent }}
          >
            {initials(brand.name)}
          </AvatarFallback>
        </Avatar>

        <div className="mt-4 space-y-2">
          <h1 className="text-[26px] font-bold tracking-tight text-foreground sm:text-[30px]">
            {brand.name}
          </h1>
          {brand.tagline && (
            <p
              className="text-[15px] font-medium"
              style={{ color: accent }}
            >
              {brand.tagline}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            {brand.primary_cuisine && (
              <Badge variant="default">{brand.primary_cuisine}</Badge>
            )}
            {(brand.secondary_cuisines ?? []).slice(0, 4).map((c) => (
              <Badge key={c} variant="default" className="bg-warm-100">
                {c}
              </Badge>
            ))}
            {locations[0]?.average_rating != null && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[12px] font-semibold text-amber-700">
                <Star className="h-3.5 w-3.5 fill-current" />
                {Number(locations[0].average_rating).toFixed(1)}
                <span className="font-normal text-amber-700/80">
                  ({locations.reduce((s, l) => s + (l.review_count ?? 0), 0)} reviews)
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Story */}
        {brand.story && (
          <div className="mt-5 rounded-xl bg-warm-50/60 p-4">
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-foreground/85">
              {brand.story}
            </p>
          </div>
        )}

        {/* Social row */}
        {(brand.website_url ||
          brand.instagram_url ||
          brand.tiktok_url ||
          brand.facebook_url ||
          brand.x_url) && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {brand.website_url && (
              <SocialLink href={brand.website_url} accent={accent} label="Website">
                <Globe className="h-3.5 w-3.5" />
              </SocialLink>
            )}
            {brand.instagram_url && (
              <SocialLink href={brand.instagram_url} accent={accent} label="Instagram">
                <Instagram className="h-3.5 w-3.5" />
              </SocialLink>
            )}
            {brand.tiktok_url && (
              <SocialLink href={brand.tiktok_url} accent={accent} label="TikTok">
                <TikTokIcon className="h-3.5 w-3.5" />
              </SocialLink>
            )}
            {brand.facebook_url && (
              <SocialLink href={brand.facebook_url} accent={accent} label="Facebook">
                <Facebook className="h-3.5 w-3.5" />
              </SocialLink>
            )}
            {brand.x_url && (
              <SocialLink href={brand.x_url} accent={accent} label="X">
                <Twitter className="h-3.5 w-3.5" />
              </SocialLink>
            )}
          </div>
        )}
      </div>

      {/* Featured items */}
      {featuredItems.length > 0 && (
        <section className="border-t border-border px-5 py-6 sm:px-7">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Featured
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {featuredItems.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-xl border border-border bg-card p-2.5"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-warm-100">
                  {item.photo_url ? (
                    <Image
                      src={item.photo_url}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Utensils className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[13.5px] font-semibold">{item.name}</p>
                    {item.price != null && (
                      <span className="shrink-0 text-[12.5px] font-semibold tabular-nums text-muted-foreground">
                        ${Number(item.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="line-clamp-2 text-[12px] text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  {(item.dietary_tags ?? []).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(item.dietary_tags ?? []).slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded bg-warm-100 px-1.5 py-0.5 text-[10px] text-warm-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Locations */}
      <section className="border-t border-border px-5 py-6 sm:px-7">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {locations.length === 1 ? 'Location' : `${locations.length} locations`}
        </h2>
        {locations.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted-foreground">No locations yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {locations.map((loc) => {
              const todayHours = (loc.hours as any)?.[weekdayKey];
              const closed = loc.is_temporarily_closed || todayHours?.is_closed;
              return (
                <li
                  key={loc.id}
                  className="rounded-xl border border-border bg-card p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-warm-100">
                      {loc.cover_photo_url ? (
                        <Image
                          src={loc.cover_photo_url}
                          alt={loc.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <MapPin className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-semibold">{loc.name}</p>
                        {closed ? (
                          <Badge variant="destructive">Closed</Badge>
                        ) : todayHours ? (
                          <Badge variant="success">Open today</Badge>
                        ) : null}
                      </div>
                      <p className="truncate text-[12.5px] text-muted-foreground">
                        {loc.address}
                        {loc.city ? `, ${loc.city}` : ''}
                        {loc.state ? `, ${loc.state}` : ''}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11.5px] text-muted-foreground">
                        {loc.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {loc.phone}
                          </span>
                        )}
                        {loc.average_rating != null && (
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <Star className="h-3 w-3 fill-current" />
                            {Number(loc.average_rating).toFixed(1)}
                            <span className="text-muted-foreground">
                              ({loc.review_count ?? 0})
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hours */}
                  {loc.hours && (
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-warm-50/60 p-3 text-[12px] sm:grid-cols-3">
                      {WEEKDAYS.map(({ key, label }) => {
                        const d = (loc.hours as any)?.[key];
                        const isToday = key === weekdayKey;
                        if (!d || d.is_closed) {
                          return (
                            <div
                              key={key}
                              className={cn(
                                'flex justify-between',
                                isToday && 'font-semibold text-foreground',
                              )}
                            >
                              <span className="text-muted-foreground">{label}</span>
                              <span className="italic text-muted-foreground/80">Closed</span>
                            </div>
                          );
                        }
                        const openStr = d.open_note ?? formatTime(d.open);
                        const closeStr = d.close_note ?? formatTime(d.close);
                        return (
                          <div
                            key={key}
                            className={cn(
                              'flex justify-between gap-2',
                              isToday && 'font-semibold text-foreground',
                            )}
                          >
                            <span className={isToday ? 'text-foreground' : 'text-muted-foreground'}>
                              {label}
                            </span>
                            <span className="truncate">
                              {openStr} – {closeStr}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Reviews */}
      {recentReviews.length > 0 && (
        <section className="border-t border-border px-5 py-6 sm:px-7">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Recent reviews
          </h2>
          <ul className="mt-3 space-y-3">
            {recentReviews.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-border bg-card p-3.5"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={r.reviewer_avatar_url ?? undefined} />
                    <AvatarFallback className="bg-warm-100 text-warm-700 text-[11px]">
                      {initials(r.reviewer_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-semibold">{r.reviewer_name}</p>
                      <span className="inline-flex items-center gap-0.5 text-amber-600">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelative(r.created_at)}
                      </span>
                    </div>
                    {r.text && (
                      <p className="mt-1 text-[13px] text-foreground/85">{r.text}</p>
                    )}
                    {r.location_name && (
                      <p className="mt-1 text-[11.5px] text-muted-foreground">
                        At {r.location_name}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Footer */}
      <div className="border-t border-border bg-warm-50/40 px-5 py-3 text-center text-[11px] text-muted-foreground sm:px-7">
        Powered by{' '}
        <Link href="/" className="font-semibold hover:text-foreground">
          SeeIt
        </Link>
      </div>
    </div>
  );
}

function SocialLink({
  href,
  accent,
  label,
  children,
}: {
  href: string;
  accent: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-warm-50"
      style={{ color: accent, borderColor: accent + '40' }}
    >
      {children}
    </a>
  );
}

function formatTime(hhmm: string | undefined): string {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const period = h < 12 ? 'AM' : 'PM';
  const display = ((h + 11) % 12) + 1;
  return `${display}:${String(m ?? 0).padStart(2, '0')} ${period}`;
}
