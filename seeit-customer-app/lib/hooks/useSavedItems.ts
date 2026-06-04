import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSavedItems, saveLocation, saveMenuItem, unsaveItem } from '../api/savedItems';
import { useAuth } from './useAuth';

export function useSavedItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['saved', user?.id],
    queryFn: () => (user ? fetchSavedItems(user.id) : Promise.resolve([])),
    enabled: !!user,
  });
}

export function useToggleSavedLocation() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ locationId, currentId }: { locationId: string; currentId: string | null }) => {
      if (currentId) {
        await unsaveItem(currentId);
      } else {
        await saveLocation(locationId);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved', user?.id] }),
  });
}

export function useToggleSavedMenuItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ menuItemId, currentId }: { menuItemId: string; currentId: string | null }) => {
      if (currentId) {
        await unsaveItem(currentId);
      } else {
        await saveMenuItem(menuItemId);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved', user?.id] }),
  });
}
