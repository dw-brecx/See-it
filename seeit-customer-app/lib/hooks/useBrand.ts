import { useQuery } from '@tanstack/react-query';
import { fetchBrand, fetchLocationsForBrand } from '../api/brands';

export function useBrand(brandId: string | undefined) {
  return useQuery({
    queryKey: ['brand', brandId],
    queryFn: () => fetchBrand(brandId!),
    enabled: !!brandId,
  });
}

export function useBrandLocations(brandId: string | undefined) {
  return useQuery({
    queryKey: ['brand-locations', brandId],
    queryFn: () => fetchLocationsForBrand(brandId!),
    enabled: !!brandId,
  });
}
