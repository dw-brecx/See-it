/**
 * Google Places API helpers (server-side). The corresponding /api/google/*
 * routes wrap these so we never expose the key to the browser.
 *
 * If GOOGLE_PLACES_API_KEY is unset, callers throw GoogleNotConfigured
 * and the UI shows a "connect Google" empty state.
 */

export class GoogleNotConfigured extends Error {
  constructor() {
    super('Google Places API key not configured');
    this.name = 'GoogleNotConfigured';
  }
}

export function isGoogleConfigured(): boolean {
  return !!process.env.GOOGLE_PLACES_API_KEY;
}

export type PlaceSummary = {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
};

export type PlaceDetails = {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  geometry?: { location?: { lat: number; lng: number } };
  opening_hours?: {
    weekday_text?: string[];
    periods?: { open: { day: number; time: string }; close?: { day: number; time: string } }[];
  };
  photos?: { photo_reference: string; height: number; width: number }[];
  website?: string;
  url?: string;
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  address_components?: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
};

const BASE = 'https://maps.googleapis.com/maps/api/place';

export async function searchBusinesses(
  query: string,
  location?: { lat: number; lng: number },
): Promise<PlaceSummary[]> {
  if (!isGoogleConfigured()) throw new GoogleNotConfigured();
  const params = new URLSearchParams({
    query,
    key: process.env.GOOGLE_PLACES_API_KEY!,
    type: 'restaurant',
  });
  if (location) params.set('location', `${location.lat},${location.lng}`);
  const url = `${BASE}/textsearch/json?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Google Places error: ${res.status}`);
  const data = (await res.json()) as { status: string; results?: PlaceSummary[]; error_message?: string };
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(data.error_message ?? `Google: ${data.status}`);
  }
  return (data.results ?? []).slice(0, 10);
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  if (!isGoogleConfigured()) throw new GoogleNotConfigured();
  const fields = [
    'place_id',
    'name',
    'formatted_address',
    'formatted_phone_number',
    'international_phone_number',
    'geometry',
    'opening_hours',
    'photos',
    'website',
    'url',
    'types',
    'rating',
    'user_ratings_total',
    'address_components',
  ].join(',');
  const url = `${BASE}/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${process.env.GOOGLE_PLACES_API_KEY!}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Google Places error: ${res.status}`);
  const data = (await res.json()) as { status: string; result?: PlaceDetails; error_message?: string };
  if (data.status !== 'OK') {
    throw new Error(data.error_message ?? `Google: ${data.status}`);
  }
  return data.result!;
}

/** Photo URL builder. Returns an empty string if no key is set. */
export function placePhotoUrl(photoReference: string, maxWidth = 800): string {
  if (!isGoogleConfigured()) return '';
  return `${BASE}/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${process.env.GOOGLE_PLACES_API_KEY!}`;
}

/**
 * Normalize Google's `opening_hours.periods` into the SeeIt `WeekHours` shape.
 * Google uses Sunday=0, our schema uses 'mon'…'sun'. Times are 'HHMM' strings.
 */
export function googleHoursToWeekHours(
  periods: { open: { day: number; time: string }; close?: { day: number; time: string } }[],
): Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', { is_closed: boolean; open?: string; close?: string }> {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  const out: any = {
    mon: { is_closed: true },
    tue: { is_closed: true },
    wed: { is_closed: true },
    thu: { is_closed: true },
    fri: { is_closed: true },
    sat: { is_closed: true },
    sun: { is_closed: true },
  };
  for (const p of periods) {
    const key = days[p.open.day];
    if (!key) continue;
    const open = formatTime(p.open.time);
    const close = p.close ? formatTime(p.close.time) : '23:59';
    out[key] = { is_closed: false, open, close };
  }
  return out;
}

function formatTime(hhmm: string): string {
  if (!hhmm || hhmm.length < 4) return '00:00';
  return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`;
}

/** Split a Google address_components array into city/state/zip/country. */
export function parseAddressComponents(
  components: { long_name: string; short_name: string; types: string[] }[] | undefined,
): { city?: string; state?: string; zip?: string; country?: string } {
  if (!components) return {};
  const find = (type: string) => components.find((c) => c.types.includes(type));
  return {
    city: find('locality')?.long_name ?? find('postal_town')?.long_name,
    state: find('administrative_area_level_1')?.short_name,
    zip: find('postal_code')?.long_name,
    country: find('country')?.short_name,
  };
}
