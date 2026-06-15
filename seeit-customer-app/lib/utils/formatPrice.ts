export function formatPrice(price: number | null | undefined): string {
  if (price == null) return '';
  if (price === 0) return 'Free';
  return `$${price.toFixed(2)}`;
}
