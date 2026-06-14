import { supabase } from '../supabase/client';
import { Brand, KosherCert, HalalCert, Location } from '../types';
import { distanceMiles } from '../utils/distance';
import { debugLog } from '../utils/debugLog';
import { isVisible } from './visibility';

export async function fetchLocationDetail(locationId: string): Promise<{
  brand: Brand;
  location: Location;
  kosher: KosherCert | null;
  halal: HalalCert | null;
} | null> {
  debugLog('location.detail', 'querying', { locationId });
  const [locRes, kosherRes, halalRes] = await Promise.all([
    supabase
      .from('locations')
      .select('*, brand:brands(*)')
      .eq('id', locationId)
      .maybeSingle(),
    supabase
      .from('kosher_certifications')
      .select('*')
      .eq('location_id', locationId)
      .maybeSingle(),
    Promise.resolve(
      supabase
        .from('halal_certifications')
        .select('*')
        .eq('location_id', locationId)
        .maybeSingle(),
    ).catch(() => ({ data: null })),
  ]);
  const loc = locRes.data as any;
  debugLog('location.detail', 'result', {
    found: !!loc,
    locError: locRes.error?.message,
  });
  if (!loc) return null;
  const brand = loc.brand as Brand;
  if (!brand) {
    debugLog('location.detail', 'no brand — bad FK?', { locationId });
    return null;
  }
  if (!isVisible(brand)) {
    debugLog('location.detail', 'brand hidden');
    return null;
  }
  const { brand: _b, ...location } = loc;
  return {
    brand,
    location: location as Location,
    kosher: (kosherRes.data ?? null) as KosherCert | null,
    halal: ((halalRes as any).data ?? null) as HalalCert | null,
  };
}

export async function fetchNearbyBrands(
  userLat: number,
  userLng: number,
  radiusMiles = 25,
  limit = 30,
): Promise<{ brand: Brand; nearest: Location; distance_miles: number }[]> {
  const latDelta = radiusMiles / 69;
  const lngDelta = radiusMiles / (69 * Math.cos((userLat * Math.PI) / 180));

  debugLog('home.discover', 'querying nearby', {
    userLat,
    userLng,
    radiusMiles,
  });

  const { data, error } = await supabase
    .from('locations')
    .select('*, brand:brands(*)')
    .gte('latitude', userLat - latDelta)
    .lte('latitude', userLat + latDelta)
    .gte('longitude', userLng - lngDelta)
    .lte('longitude', userLng + lngDelta);

  debugLog('home.discover', 'raw result', {
    count: data?.length ?? 0,
    error: error?.message,
  });
  if (error || !data) return [];

  const grouped = new Map<string, { brand: Brand; nearest: Location; distance_miles: number }>();
  let droppedNoBrand = 0;
  let droppedHidden = 0;
  let droppedOutOfRadius = 0;
  let droppedNoCoords = 0;

  for (const row of data as any[]) {
    const brand = row.brand as Brand | null;
    if (!brand) {
      droppedNoBrand++;
      continue;
    }
    if (!isVisible(brand)) {
      droppedHidden++;
      continue;
    }
    const { brand: _b, ...location } = row;
    // Hard guard — NaN distance from missing coords poisoned the radius
    // check before (NaN > X is false, so the row was kept).
    if (
      typeof location.latitude !== 'number' ||
      typeof location.longitude !== 'number'
    ) {
      droppedNoCoords++;
      continue;
    }
    const d = distanceMiles(userLat, userLng, location.latitude, location.longitude);
    if (!Number.isFinite(d) || d > radiusMiles) {
      droppedOutOfRadius++;
      continue;
    }
    const existing = grouped.get(brand.id);
    if (!existing || d < existing.distance_miles) {
      grouped.set(brand.id, { brand, nearest: location as Location, distance_miles: d });
    }
  }

  debugLog('home.discover', 'filtered', {
    kept_brands: grouped.size,
    dropped_no_brand: droppedNoBrand,
    dropped_hidden: droppedHidden,
    dropped_out_of_radius: droppedOutOfRadius,
    dropped_no_coords: droppedNoCoords,
  });

  return [...grouped.values()]
    .sort((a, b) => a.distance_miles - b.distance_miles)
    .slice(0, limit);
}
