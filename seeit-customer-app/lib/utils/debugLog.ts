/**
 * Tagged, timestamped logger. In production builds the calls are no-ops —
 * the terminal noise is dev-only. To keep diagnostic output in a release
 * build, set EXPO_PUBLIC_DEBUG_LOG=1 in .env.
 */
const ENABLED =
  // @ts-ignore — __DEV__ is injected by Metro
  typeof __DEV__ === 'undefined'
    ? false
    : (__DEV__ as boolean) || process.env.EXPO_PUBLIC_DEBUG_LOG === '1';

export function debugLog(tag: string, msg: string, data?: unknown): void {
  if (!ENABLED) return;
  const ts = new Date().toISOString().slice(11, 23);
  if (data !== undefined) {
    // eslint-disable-next-line no-console
    console.log(`[SeeIt ${ts}] ${tag}: ${msg}`, data);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[SeeIt ${ts}] ${tag}: ${msg}`);
  }
}
