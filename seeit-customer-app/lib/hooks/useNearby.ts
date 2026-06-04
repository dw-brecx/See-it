import { useQuery } from '@tanstack/react-query';
import { fetchNearbyBrands } from '../api/locations';
import { useAppStore } from '../store';

export function useNearbyBrands(radiusMiles = 10) {
  const coords = useAppStore((s) => s.coords);
  return useQuery({
    queryKey: ['nearby', coords?.latitude, coords?.longitude, radiusMiles],
    queryFn: () =>
      coords ? fetchNearbyBrands(coords.latitude, coords.longitude, radiusMiles) : Promise.resolve([]),
    enabled: !!coords,
  });
}
