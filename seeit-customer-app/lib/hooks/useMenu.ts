import { useQuery } from '@tanstack/react-query';
import { fetchMenuForLocation, fetchMenuItem } from '../api/menuItems';

export function useMenu(locationId: string | undefined) {
  return useQuery({
    queryKey: ['menu', locationId],
    queryFn: () => fetchMenuForLocation(locationId!),
    enabled: !!locationId,
  });
}

export function useMenuItem(menuItemId: string | undefined) {
  return useQuery({
    queryKey: ['menu-item', menuItemId],
    queryFn: () => fetchMenuItem(menuItemId!),
    enabled: !!menuItemId,
  });
}
