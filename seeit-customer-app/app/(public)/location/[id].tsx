import { Redirect, useLocalSearchParams } from 'expo-router';

/** Deep-link alias for per-location QR codes (`seeit://location/<id>`). */
export default function LocationAlias() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/restaurant/location/${String(id ?? '')}`} />;
}
