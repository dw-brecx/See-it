/**
 * Map a cuisine string to a soft chip color palette. Stable hashing — the
 * same cuisine always renders the same color across the app. The palette
 * is muted on purpose (teal, slate, burgundy, etc.) so cards don't look
 * like a kindergarten classroom.
 */
const PALETTE = [
  { bg: '#E0F2F1', fg: '#0F766E' }, // teal
  { bg: '#FEF3C7', fg: '#92400E' }, // amber
  { bg: '#FCE7F3', fg: '#9D174D' }, // rose
  { bg: '#E0E7FF', fg: '#3730A3' }, // indigo
  { bg: '#FEE2E2', fg: '#991B1B' }, // soft red
  { bg: '#F3E8FF', fg: '#6B21A8' }, // violet
  { bg: '#DCFCE7', fg: '#166534' }, // green
  { bg: '#E2E8F0', fg: '#1E293B' }, // slate
  { bg: '#FFE4E6', fg: '#9F1239' }, // burgundy
  { bg: '#CFFAFE', fg: '#155E75' }, // cyan
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getCuisineColor(cuisine: string | null | undefined): {
  bg: string;
  fg: string;
} {
  if (!cuisine) return PALETTE[7];
  return PALETTE[hash(cuisine) % PALETTE.length];
}
