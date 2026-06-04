'use client';

import { ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhotoUpload } from '@/components/PhotoUpload';
import { HALAL_AGENCIES, STORAGE } from '@/lib/constants';

export type HalalCertValues = {
  agency: string;
  agency_other: string;
  certificate_image_url: string;
  expiration_date: string;
};

type Props = {
  value: HalalCertValues;
  onChange: (next: HalalCertValues) => void;
  /** Prefix passed to the PhotoUpload component (e.g. `halal-certs/<brandId>`). */
  uploadPrefix: string;
};

/**
 * Halal certification sub-section of LocationForm. Renders only when "Halal"
 * is in the location's dietary tags. Pure controlled component.
 */
export function HalalCertForm({ value, onChange, uploadPrefix }: Props) {
  function patch<K extends keyof HalalCertValues>(key: K, v: HalalCertValues[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-emerald-700">
        <ShieldCheck className="h-4 w-4" />
        Halal certification
      </h3>

      <div className="space-y-2">
        <Label htmlFor="halal-agency">Certifying agency *</Label>
        <Select value={value.agency} onValueChange={(v) => patch('agency', v)}>
          <SelectTrigger id="halal-agency">
            <SelectValue placeholder="Pick an agency" />
          </SelectTrigger>
          <SelectContent>
            {HALAL_AGENCIES.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Required when "Halal" is in your dietary tags.
        </p>
      </div>

      {value.agency === 'Other' && (
        <div className="space-y-2">
          <Label htmlFor="halal-agency-other">Specify agency</Label>
          <Input
            id="halal-agency-other"
            placeholder="Name of the certifying body"
            value={value.agency_other}
            onChange={(e) => patch('agency_other', e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Certificate image / PDF</Label>
        <PhotoUpload
          bucket={STORAGE.KOSHER_CERTS}
          prefix={uploadPrefix}
          value={value.certificate_image_url || null}
          onChange={(url) => patch('certificate_image_url', url ?? '')}
        />
        <p className="text-[11.5px] text-muted-foreground">
          Upload a photo or PDF of your current halal certificate.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="halal-expiration">Expiration date</Label>
        <Input
          id="halal-expiration"
          type="date"
          value={value.expiration_date}
          onChange={(e) => patch('expiration_date', e.target.value)}
        />
      </div>
    </div>
  );
}

export const EMPTY_HALAL: HalalCertValues = {
  agency: '',
  agency_other: '',
  certificate_image_url: '',
  expiration_date: '',
};
