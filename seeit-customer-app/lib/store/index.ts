import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LocationCoords = { latitude: number; longitude: number };

type AppState = {
  // Device location (null until permission granted + fix obtained)
  coords: LocationCoords | null;
  setCoords: (c: LocationCoords | null) => void;

  // Manual location label, set when user picks a city from the picker.
  manualLocationLabel: string | null;
  setManualLocation: (label: string | null, coords: LocationCoords | null) => void;

  // Developer mode — persists across launches via AsyncStorage key `devMode`.
  // When on, Home rail ignores distance filtering and shows every brand.
  devMode: boolean;
  setDevMode: (on: boolean) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filters: {
    cuisines: string[];
    dietary: string[];
    establishments: string[];
    minRating: number | null;
    maxDistance: number | null;
    openNow: boolean;
    hasPhotos: boolean;
  };
  setFilters: (next: Partial<AppState['filters']>) => void;
  clearFilters: () => void;

  orderList: {
    locationId: string | null;
    items: {
      menu_item_id: string;
      quantity: number;
      notes: string | null;
      assigned_to: string | null;
    }[];
  };
  setOrderLocation: (locationId: string | null) => void;
  addOrderItem: (menuItemId: string) => void;
  updateOrderItem: (
    menuItemId: string,
    patch: Partial<{
      quantity: number;
      notes: string | null;
      assigned_to: string | null;
    }>,
  ) => void;
  removeOrderItem: (menuItemId: string) => void;
  clearOrderList: () => void;
};

const EMPTY_FILTERS: AppState['filters'] = {
  cuisines: [],
  dietary: [],
  establishments: [],
  minRating: null,
  maxDistance: null,
  openNow: false,
  hasPhotos: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      coords: null,
      setCoords: (c) => set({ coords: c }),

      manualLocationLabel: null,
      setManualLocation: (label, coords) =>
        set({ manualLocationLabel: label, coords }),

      devMode: false,
      setDevMode: (on) => set({ devMode: on }),

      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),

      filters: EMPTY_FILTERS,
      setFilters: (next) => set({ filters: { ...get().filters, ...next } }),
      clearFilters: () => set({ filters: EMPTY_FILTERS }),

      orderList: { locationId: null, items: [] },
      setOrderLocation: (locationId) =>
        set((s) =>
          s.orderList.locationId === locationId
            ? s
            : { orderList: { locationId, items: [] } },
        ),
      addOrderItem: (menuItemId) =>
        set((s) => {
          const existing = s.orderList.items.find(
            (i) => i.menu_item_id === menuItemId,
          );
          if (existing) {
            return {
              orderList: {
                ...s.orderList,
                items: s.orderList.items.map((i) =>
                  i.menu_item_id === menuItemId
                    ? { ...i, quantity: i.quantity + 1 }
                    : i,
                ),
              },
            };
          }
          return {
            orderList: {
              ...s.orderList,
              items: [
                ...s.orderList.items,
                {
                  menu_item_id: menuItemId,
                  quantity: 1,
                  notes: null,
                  assigned_to: null,
                },
              ],
            },
          };
        }),
      updateOrderItem: (menuItemId, patch) =>
        set((s) => ({
          orderList: {
            ...s.orderList,
            items: s.orderList.items.map((i) =>
              i.menu_item_id === menuItemId ? { ...i, ...patch } : i,
            ),
          },
        })),
      removeOrderItem: (menuItemId) =>
        set((s) => ({
          orderList: {
            ...s.orderList,
            items: s.orderList.items.filter(
              (i) => i.menu_item_id !== menuItemId,
            ),
          },
        })),
      clearOrderList: () => set({ orderList: { locationId: null, items: [] } }),
    }),
    {
      name: 'seeit-app-state',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist devMode — everything else stays in memory.
      partialize: (state) => ({ devMode: state.devMode }),
    },
  ),
);
