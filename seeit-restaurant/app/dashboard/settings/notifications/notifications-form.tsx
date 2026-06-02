'use client';

import * as React from 'react';
import { Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Prefs = {
  email_new_review: boolean;
  email_one_star_review: boolean;
  email_new_photo_on_dish: boolean;
  email_new_team_member: boolean;
  email_weekly_digest: boolean;
  sms_one_star_review: boolean;
  sms_weekly_digest: boolean;
};

const DEFAULTS: Prefs = {
  email_new_review: true,
  email_one_star_review: true,
  email_new_photo_on_dish: false,
  email_new_team_member: true,
  email_weekly_digest: true,
  sms_one_star_review: false,
  sms_weekly_digest: false,
};

const STORAGE_KEY = 'seeit.notification-prefs.v1';

const EMAIL_ROWS: { key: keyof Prefs; label: string; description: string }[] = [
  {
    key: 'email_new_review',
    label: 'Email me when a new review comes in',
    description: 'Any time a customer leaves a star rating.',
  },
  {
    key: 'email_one_star_review',
    label: 'Email me when a 1-star review comes in',
    description: 'Same as the above but flagged urgent — also covers 2-star.',
  },
  {
    key: 'email_new_photo_on_dish',
    label: 'Email me when a customer uploads a photo of one of my dishes',
    description: 'So you can react quickly to user-generated content.',
  },
  {
    key: 'email_new_team_member',
    label: 'Email me when a team member is added or removed',
    description: 'Helpful audit trail for multi-owner brands.',
  },
  {
    key: 'email_weekly_digest',
    label: 'Email me a weekly digest',
    description: 'Monday morning summary: reviews, photos, rating trend.',
  },
];

const SMS_ROWS: { key: keyof Prefs; label: string; description: string }[] = [
  {
    key: 'sms_one_star_review',
    label: 'Text me when a 1- or 2-star review comes in',
    description: 'Standard rates apply. Requires verified phone on your account.',
  },
  {
    key: 'sms_weekly_digest',
    label: 'Text me the weekly digest summary',
    description: 'Short version. Tap link for full details.',
  },
];

function loadPrefs(): Prefs {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export function NotificationsForm() {
  const [prefs, setPrefs] = React.useState<Prefs>(DEFAULTS);
  const [hydrated, setHydrated] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const submittingRef = React.useRef(false);

  React.useEffect(() => {
    setPrefs(loadPrefs());
    setHydrated(true);
  }, []);

  function toggle(key: keyof Prefs, value: boolean) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      toast.success('Preferences saved locally');
    } finally {
      submittingRef.current = false;
      // small delay so the spinner is visible
      setTimeout(() => setSaving(false), 200);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-[13px] text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Settings stored locally — server sync coming with email integration.
          You can update them now and they'll move over automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>
            Sent to the email address on your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {EMAIL_ROWS.map((row) => (
              <li
                key={row.key}
                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium">{row.label}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {row.description}
                  </p>
                </div>
                <Switch
                  checked={hydrated ? prefs[row.key] : DEFAULTS[row.key]}
                  onCheckedChange={(v) => toggle(row.key, v)}
                  aria-label={row.label}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMS</CardTitle>
          <CardDescription>
            Sent to the phone number on your account. Coming soon — toggle to be
            opted in once it ships.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {SMS_ROWS.map((row) => (
              <li
                key={row.key}
                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium">{row.label}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {row.description}
                  </p>
                </div>
                <Switch
                  checked={hydrated ? prefs[row.key] : DEFAULTS[row.key]}
                  onCheckedChange={(v) => toggle(row.key, v)}
                  aria-label={row.label}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            'Save preferences'
          )}
        </Button>
      </div>
    </form>
  );
}
