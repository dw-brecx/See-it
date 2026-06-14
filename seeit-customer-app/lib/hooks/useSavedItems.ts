import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSavedItems,
  saveLocation,
  saveMenuItem,
  unsaveItem,
  setWantToTry,
  SavedItemRow,
} from '../api/savedItems';
import { useAuth } from './useAuth';

export function useSavedItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['saved', user?.id],
    queryFn: () =>
      user ? fetchSavedItems(user.id) : Promise.resolve([] as SavedItemRow[]),
    enabled: !!user,
  });
}

/** O(1) lookup: is this location currently saved? returns the row id or null. */
export function useSavedLocationId(locationId: string | null | undefined): {
  savedId: string | null;
  wantToTry: boolean;
} {
  const { data } = useSavedItems();
  return React.useMemo(() => {
    if (!locationId || !data) return { savedId: null, wantToTry: false };
    const row = data.find(
      (s) => s.item_type === 'location' && s.location_id === locationId,
    );
    return {
      savedId: row?.id ?? null,
      wantToTry: !!row?.is_want_to_try,
    };
  }, [data, locationId]);
}

export function useSavedMenuItemId(menuItemId: string | null | undefined): {
  savedId: string | null;
  wantToTry: boolean;
} {
  const { data } = useSavedItems();
  return React.useMemo(() => {
    if (!menuItemId || !data) return { savedId: null, wantToTry: false };
    const row = data.find(
      (s) => s.item_type === 'menu_item' && s.menu_item_id === menuItemId,
    );
    return {
      savedId: row?.id ?? null,
      wantToTry: !!row?.is_want_to_try,
    };
  }, [data, menuItemId]);
}

export function useToggleSavedLocation() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      locationId,
      currentId,
      wantToTry,
    }: {
      locationId: string;
      currentId: string | null;
      wantToTry?: boolean;
    }) => {
      if (currentId) {
        await unsaveItem(currentId);
      } else {
        await saveLocation(locationId, { wantToTry });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved', user?.id] }),
  });
}

export function useToggleSavedMenuItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      menuItemId,
      currentId,
      wantToTry,
    }: {
      menuItemId: string;
      currentId: string | null;
      wantToTry?: boolean;
    }) => {
      if (currentId) {
        await unsaveItem(currentId);
      } else {
        await saveMenuItem(menuItemId, { wantToTry });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved', user?.id] }),
  });
}

export function useSetWantToTry() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, want }: { id: string; want: boolean }) =>
      setWantToTry(id, want),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved', user?.id] }),
  });
}
