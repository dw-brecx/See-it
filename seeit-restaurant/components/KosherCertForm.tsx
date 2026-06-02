'use client';

import * as React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhotoUpload } from '@/components/PhotoUpload';
import { KOSHER_AGENCIES, KOSHER_TYPES, STORAGE } from '@/lib/constants';
import type { KosherKind } from '@/lib/database.types';

export type KosherCertValues = {
  agency: string;
  agency_other: string;
  kosher_type: string;
  is_glatt: boolean;
  is_cholov_yisroel: boolean;
  is_pas_yisroel: boolean;
  is_bishul_yisroel: boolean;
  is_yoshon: boolean;
  is_kosher_for_passover: boolean;
  certificate_image_url: string;
  expiration_date: string;
};

type Props = {
  value: KosherCertValues;
  onChange: (next: KosherCertValues) => void;
  /** Prefix passed to the PhotoUpload component (e.g. `certs/<brandId>`). */
  uploadPrefix: string;
};

const SUB_CERTS: { key: keyof KosherCertValues; label: string }[] = [
  { key: 'is_glatt', label: 'Glatt' },
  { key: 'is_cholov_yisroel', label: 'Cholov Yisroel' },
  { key: 'is_pas_yisroel', label: 'Pas Yisroel' },
  { key: 'is_bishul_yisroel', label: 'Bishul Yisroel' },
  { key: 'is_yoshon', label: 'Yoshon' },
  { key: 'is_kosher_for_passover', label: 'Kosher for Passover' },
];

/**
 * Sub-section of LocationForm that captures kosher certification details.
 * Renders only when "Kosher" is in the location's dietary tags.
 *
 * Pure controlled component — receives `value` and `onChange` and never
 * touches the database itself.
 */
export function KosherCertForm({ value, onChange, uploadPrefix }: Props) {
  function patch<K extends keyof KosherCertValues>(key: K, v: KosherCertValues[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-blue-700">
        <ShieldCheck className="h-4 w-4" />
        Kosher certification
      </h3>

      <div className="space-y-2">
        <Label htmlFor="kosher-agency">Certifying agency *</Label>
        <Select value={value.agency} onValueChange={(v) => patch('agency', v)}>
          <SelectTrigger id="kosher-agency">
            <SelectValue placeholder="Pick an agency" />
          </SelectTrigger>
          <SelectContent>
            {KOSHER_AGENCIES.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Required when "Kosher" is in your dietary tags.
        </p>
      </div>

      {value.agency === 'Other' && (
        <div className="space-y-2">
          <Label htmlFor="kosher-agency-other">Specify agency</Label>
          <Input
            id="kosher-agency-other"
            placeholder="Name of the certifying body"
            value={value.agency_other}
            onChange={(e) => patch('agency_other', e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="kosher-type">Kosher type</Label>
        <Select
          value={value.kosher_type}
          onValueChange={(v) => patch('kosher_type', v)}
        >
          <SelectTrigger id="kosher-type">
            <SelectValue placeholder="Meat / Dairy / Pareve / Mixed" />
          </SelectTrigger>
          <SelectContent>
            {KOSHER_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Sub-certifications</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SUB_CERTS.map(({ key, label }) => (
            <label
              key={key}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-sm"
            >
              <Checkbox
                checked={!!value[key]}
                onCheckedChange={(c) => patch(key, !!c as never)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Certificate image / PDF</Label>
        <PhotoUpload
          bucket={STORAGE.KOSHER_CERTS}
          prefix={uploadPrefix}
          value={value.certificate_image_url || null}
          onChange={(url) => patch('certificate_image_url', url ?? '')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="kosher-expiration">Expiration date</Label>
        <Input
          id="kosher-expiration"
          type="date"
          value={value.expiration_date}
          onChange={(e) => patch('expiration_date', e.target.value)}
        />
      </div>
    </div>
  );
}

/** Helper used by LocationForm to derive a kosher type cast for the DB. */
export function asKosherKind(v: string): KosherKind | null {
  if (v === 'meat' || v === 'dairy' || v === 'pareve' || v === 'mixed') return v;
  return null;
}

export const EMPTY_KOSHER: KosherCertValues = {
  agency: '',
  agency_other: '',
  kosher_type: '',
  is_glatt: false,
  is_cholov_yisroel: false,
  is_pas_yisroel: false,
  is_bishul_yisroel: false,
  is_yoshon: false,
  is_kosher_for_passover: false,
  certificate_image_url: '',
  expiration_date: '',
};
