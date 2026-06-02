'use client';

import * as React from 'react';

export type BrandRef = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type LocationRef = {
  id: string;
  name: string;
  city: string | null;
  brand_id: string;
};

/**
 * Sentinel used in the location picker for "show me aggregate data
 * across every location of this brand". Pages handle this by skipping
 * the .eq('location_id', ...) filter.
 */
export const ALL_LOCATIONS = '__all__';

type Ctx = {
  brands: BrandRef[];
  locations: LocationRef[];
  currentBrandId: string | null;
  currentLocationId: string | typeof ALL_LOCATIONS;
  setCurrentBrandId: (id: string) => void;
  setCurrentLocationId: (id: string | typeof ALL_LOCATIONS) => void;
  /** Current brand + locations filtered to it. */
  currentBrand: BrandRef | null;
  currentLocation: LocationRef | null;
  /** Locations belonging to the current brand. */
  brandLocations: LocationRef[];
};

const BrandCtx = React.createContext<Ctx | null>(null);

const STORAGE_KEY = 'seeit.brand-context.v1';

type StoredState = { brandId: string | null; locationId: string };

function loadStored(): StoredState {
  if (typeof window === 'undefined') return { brandId: null, locationId: ALL_LOCATIONS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { brandId: null, locationId: ALL_LOCATIONS };
    return JSON.parse(raw);
  } catch {
    return { brandId: null, locationId: ALL_LOCATIONS };
  }
}

function persist(state: StoredState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private-mode */
  }
}

export function BrandProvider({
  brands,
  locations,
  children,
}: {
  brands: BrandRef[];
  locations: LocationRef[];
  children: React.ReactNode;
}) {
  const [currentBrandId, setBrandIdState] = React.useState<string | null>(null);
  const [currentLocationId, setLocationIdState] = React.useState<
    string | typeof ALL_LOCATIONS
  >(ALL_LOCATIONS);

  // Hydrate from localStorage once on mount.
  React.useEffect(() => {
    const stored = loadStored();
    const validBrand = brands.find((b) => b.id === stored.brandId)?.id ?? brands[0]?.id ?? null;
    setBrandIdState(validBrand);
    // Validate location belongs to current brand
    const validLoc =
      stored.locationId === ALL_LOCATIONS
        ? ALL_LOCATIONS
        : locations.find(
            (l) => l.id === stored.locationId && l.brand_id === validBrand,
          )?.id ?? ALL_LOCATIONS;
    setLocationIdState(validLoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on change.
  React.useEffect(() => {
    if (currentBrandId === null) return;
    persist({ brandId: currentBrandId, locationId: currentLocationId });
  }, [currentBrandId, currentLocationId]);

  const setCurrentBrandId = React.useCallback(
    (id: string) => {
      setBrandIdState(id);
      // Reset location selector when brand changes
      setLocationIdState(ALL_LOCATIONS);
    },
    [],
  );

  const setCurrentLocationId = React.useCallback(
    (id: string | typeof ALL_LOCATIONS) => setLocationIdState(id),
    [],
  );

  const currentBrand = React.useMemo(
    () => brands.find((b) => b.id === currentBrandId) ?? null,
    [brands, currentBrandId],
  );
  const brandLocations = React.useMemo(
    () => locations.filter((l) => l.brand_id === currentBrandId),
    [locations, currentBrandId],
  );
  const currentLocation = React.useMemo(
    () =>
      currentLocationId === ALL_LOCATIONS
        ? null
        : brandLocations.find((l) => l.id === currentLocationId) ?? null,
    [brandLocations, currentLocationId],
  );

  const value: Ctx = {
    brands,
    locations,
    currentBrandId,
    currentLocationId,
    setCurrentBrandId,
    setCurrentLocationId,
    currentBrand,
    currentLocation,
    brandLocations,
  };

  return <BrandCtx.Provider value={value}>{children}</BrandCtx.Provider>;
}

export function useBrand(): Ctx {
  const ctx = React.useContext(BrandCtx);
  if (!ctx) throw new Error('useBrand must be used within BrandProvider');
  return ctx;
}
