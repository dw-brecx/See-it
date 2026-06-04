import { supabase } from '../supabase/client';
import { Brand, KosherCert, HalalCert, Location } from '../types';
import { distanceMiles } from '../utils/distance';

/** Single location + its brand. */
export async function fetchLocationDetail(locationId: string): Promise<{
  brand: Brand;
  location: Location;
  kosher: KosherCert | null;
  halal: HalalCert | null;
} | null> {
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
    // halal_certifications might not exist on older deployments
    Promise.resolve(
      supabase
        .from('halal_certifications')
        .select('*')
        .eq('location_id', locationId)
        .maybeSingle(),
    ).catch(() => ({ data: null })),
  ]);
  const loc: any = locRes.data;
  if (!loc) return null;
  const brand = loc.brand as Brand;
  if (!brand || brand.storefront_published === false || brand.is_suspended) return null;
  const { brand: _b, ...location } = loc;
  return {
    brand,
    location: location as Location,
    kosher: (kosherRes.data ?? null) as KosherCert | null,
    halal: ((halalRes as any).data ?? null) as HalalCert | null,
  };
}

/** Nearby restaurants — bounding-box prefilter + client-side haversine sort. */
export async function fetchNearbyBrands(
  userLat: number,
  userLng: number,
  radiusMiles = 10,
  limit = 30,
): Promise<{ brand: Brand; nearest: Location; distance_miles: number }[]> {
  // Rough degrees-per-mile (1° lat ≈ 69mi). Use a slightly looser bound to
  // avoid edge-of-radius drops. Longitude varies with latitude.
  const latDelta = radiusMiles / 69;
  const lngDelta = radiusMiles / (69 * Math.cos((userLat * Math.PI) / 180));

  const { data } = await supabase
    .from('locations')
    .select('*, brand:brands(*)')
    .gte('latitude', userLat - latDelta)
    .lte('latitude', userLat + latDelta)
    .gte('longitude', userLng - lngDelta)
    .lte('longitude', userLng + lngDelta);

  const grouped = new Map<string, { brand: Brand; nearest: Location; distance_miles: number }>();
  for (const row of (data ?? []) as any[]) {
    const brand = row.brand as Brand | null;
    if (!brand) continue;
    if (brand.storefront_published === false || brand.is_suspended) continue;
    const { brand: _b, ...location } = row;
    if (location.latitude == null || location.longitude == null) continue;
    const d = distanceMiles(userLat, userLng, location.latitude, location.longitude);
    if (d > radiusMiles) continue;
    const existing = grouped.get(brand.id);
    if (!existing || d < existing.distance_miles) {
      grouped.set(brand.id, { brand, nearest: location as Location, distance_miles: d });
    }
  }
  return [...grouped.values()].sort((a, b) => a.distance_miles - b.distance_miles).slice(0, limit);
}
