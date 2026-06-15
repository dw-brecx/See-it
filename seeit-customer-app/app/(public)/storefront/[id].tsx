import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Deep-link alias — `seeit://storefront/<id>` and
 * `https://seeit.app/s/<id>` both land here and forward to the canonical
 * /restaurant/[brandSlug] route. Keeping two URL schemes alive means QR
 * codes printed today still work after future route renames.
 */
export default function StorefrontAlias() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/restaurant/${String(id ?? '')}`} />;
}
