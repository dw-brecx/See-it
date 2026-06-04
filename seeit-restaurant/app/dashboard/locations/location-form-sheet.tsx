'use client';

import * as React from 'react';
import {
  LocationForm,
  type ExistingLocation,
  type KosherCert,
  type HalalCert,
} from '@/components/forms/LocationForm';
import { createClient } from '@/lib/supabase/client';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * When provided, the sheet fetches that location's full row + kosher cert
   * + halal cert before rendering LocationForm. When null, opens in create
   * mode.
   */
  locationId?: string | null;
  onSaved?: (locationId: string) => void;
};

/**
 * Thin wrapper around LocationForm that handles the "click a card → fetch
 * its full row + kosher cert + halal cert" data-loading step.
 */
export function LocationFormSheet({
  open,
  onOpenChange,
  locationId,
  onSaved,
}: Props) {
  const [loading, setLoading] = React.useState(false);
  const [location, setLocation] = React.useState<ExistingLocation | null>(null);
  const [kosherCert, setKosherCert] = React.useState<KosherCert | null>(null);
  const [halalCert, setHalalCert] = React.useState<HalalCert | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (!locationId) {
      setLocation(null);
      setKosherCert(null);
      setHalalCert(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const supabase = createClient();
      // Halal table might not exist yet (migration unrun) — wrap that one
      // so a missing-table error doesn't break the whole load.
      const [locRes, kosherRes, halalRes] = await Promise.all([
        supabase
          .from('locations')
          .select(
            'id, brand_id, name, address, city, state, zip, country, phone, latitude, longitude, cover_photo_url, description, dietary_tags, style_tags, is_temporarily_closed, reopening_date, hours',
          )
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
        ).catch(() => ({ data: null, error: null })),
      ]);
      if (cancelled) return;
      setLocation((locRes.data ?? null) as ExistingLocation | null);
      setKosherCert((kosherRes.data ?? null) as KosherCert | null);
      setHalalCert((halalRes.data ?? null) as HalalCert | null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, locationId]);

  if (open && locationId && (loading || !location)) {
    return null;
  }

  return (
    <LocationForm
      open={open}
      onOpenChange={onOpenChange}
      location={locationId ? location : null}
      kosherCert={locationId ? kosherCert : null}
      halalCert={locationId ? halalCert : null}
      onSaved={onSaved}
    />
  );
}
