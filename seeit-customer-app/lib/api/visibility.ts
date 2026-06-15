/**
 * Single source of truth for "is this brand visible to a customer?"
 * Imported by every API call that touches brands/locations/dishes so the
 * rule can only drift in one place.
 *
 * Rule:
 *   storefront_published must be explicitly true
 *   is_suspended must be NOT true (i.e. false or null)
 */
export function isVisible(b: any): boolean {
  if (!b) return false;
  if (b.storefront_published !== true) return false;
  if (b.is_suspended === true) return false;
  return true;
}

/**
 * Escape PostgREST `ilike` user input. % and _ are SQL wildcards;
 * without escaping a search for "100%" matches every row.
 */
export function escapeIlike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}
