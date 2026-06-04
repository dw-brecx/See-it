import { WeekHours, DayHours } from '../types';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
type DayKey = (typeof DAY_KEYS)[number];

function todayKey(): DayKey {
  return DAY_KEYS[new Date().getDay()];
}

/** Format a single side (open or close) — clock time if set, else note. */
function formatSide(time: string | undefined, note: string | undefined): string | null {
  if (note) return note;
  if (!time) return null;
  const [hh, mm] = time.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return time;
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return mm === 0 ? `${h12} ${ampm}` : `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
}

/** Render a day's hours as a string for inline display. */
export function formatDayHours(day: DayHours | undefined): string {
  if (!day || day.is_closed) return 'Closed';
  const open = formatSide(day.open, day.open_note);
  const close = formatSide(day.close, day.close_note);
  if (!open && !close) return 'Closed';
  if (open && close) return `${open} – ${close}`;
  return open ?? close ?? 'Closed';
}

/** Returns today's hours formatted for the "Open until X" pill. */
export function todayHours(hours: WeekHours | null | undefined): string {
  if (!hours) return '';
  const day = hours[todayKey() as keyof WeekHours];
  return formatDayHours(day);
}

/**
 * Best-effort "open now" check. Returns null when we can't tell (notes are
 * present, hours missing, etc.) so the UI can fall back to "see hours" instead
 * of lying.
 */
export function isOpenNow(hours: WeekHours | null | undefined): boolean | null {
  if (!hours) return null;
  const day = hours[todayKey() as keyof WeekHours];
  if (!day || day.is_closed) return false;
  // If either side is a note, we don't know what clock time it maps to.
  if (day.open_note || day.close_note) return null;
  if (!day.open || !day.close) return null;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const openM = toMin(day.open);
  const closeM = toMin(day.close);
  // Handle overnight (close earlier than open → close is next day)
  if (closeM < openM) return nowMinutes >= openM || nowMinutes < closeM;
  return nowMinutes >= openM && nowMinutes < closeM;
}
