'use client';

import * as React from 'react';
import {
  LocationForm,
  type ExistingLocation,
  type KosherCert,
} from '@/components/forms/LocationForm';
import { createClient } from '@/lib/supabase/client';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * When provided, the sheet fetches that location's full row + kosher cert
   * before rendering LocationForm. When null, opens in create mode.
   */
  locationId?: string | null;
  onSaved?: (locationId: string) => void;
};

/**
 * Thin wrapper around LocationForm that handles the "click a card → fetch
 * its full row + kosher cert" data-loading step. Keeps the underlying form
 * reusable for onboarding (which already has the row in hand).
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

  React.useEffect(() => {
    if (!open) return;
    if (!locationId) {
      setLocation(null);
      setKosherCert(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const [locRes, certRes] = await Promise.all([
        supabase
          .from('locations')
          .select(
            'id, brand_id, name, address, city, state, zip, country, phone, latitude, longitude, cover_photo_url, description, dietary_tags, style_tags, is_temporarily_closed, reopening_date, hours',
          )
          .eq('id', locationId)
          .maybeSingle(),
        supabase
          .from('kosher_certifications')
          .select(
            'location_id, agency, agency_other, kosher_type, is_glatt, is_cholov_yisroel, is_pas_yisroel, is_bishul_yisroel, is_yoshon, is_kosher_for_passover, certificate_image_url, expiration_date',
          )
          .eq('location_id', locationId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setLocation((locRes.data ?? null) as ExistingLocation | null);
      setKosherCert((certRes.data ?? null) as KosherCert | null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, locationId]);

  // Render nothing until data is loaded when editing — avoids defaultValues
  // capturing a stale empty row before the fetch lands.
  if (open && locationId && (loading || !location)) {
    return null;
  }

  return (
    <LocationForm
      open={open}
      onOpenChange={onOpenChange}
      location={locationId ? location : null}
      kosherCert={locationId ? kosherCert : null}
      onSaved={onSaved}
    />
  );
}
