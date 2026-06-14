/**
 * Tagged, timestamped console logger for diagnosing data-fetch paths from
 * the Expo terminal. Every call prints e.g.:
 *
 *   [SeeIt 17:52:41.108] home.discover: querying brands { lat: 41.11, lng: -74.04 }
 *   [SeeIt 17:52:41.342] home.discover: result { count: 2, error: null }
 *
 * Keep these in production for v1 — they're invaluable when seed data
 * misbehaves. Strip when we ship to the App Store.
 */
export function debugLog(tag: string, msg: string, data?: unknown): void {
  const ts = new Date().toISOString().slice(11, 23);
  if (data !== undefined) {
    // eslint-disable-next-line no-console
    console.log(`[SeeIt ${ts}] ${tag}: ${msg}`, data);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[SeeIt ${ts}] ${tag}: ${msg}`);
  }
}
