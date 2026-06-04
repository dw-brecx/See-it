export function formatPrice(price: number | null | undefined): string {
  if (price == null) return '';
  // Items are stored as numeric (assumed USD dollars). If schema later switches
  // to cents, change here only.
  return `$${price.toFixed(2)}`;
}
