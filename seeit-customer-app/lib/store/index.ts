import { create } from 'zustand';

type LocationCoords = { latitude: number; longitude: number };

type AppState = {
  // Device location (null until permission granted + fix obtained)
  coords: LocationCoords | null;
  setCoords: (c: LocationCoords | null) => void;

  // Search/filter state — used across Home and Search tabs
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filters: {
    cuisines: string[];
    dietary: string[];
    establishments: string[];
    minRating: number | null;
    maxDistance: number | null; // miles
    openNow: boolean;
    hasPhotos: boolean;
  };
  setFilters: (next: Partial<AppState['filters']>) => void;
  clearFilters: () => void;

  // Active order list (location-scoped) — purely local for v1
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
    patch: Partial<{ quantity: number; notes: string | null; assigned_to: string | null }>,
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

export const useAppStore = create<AppState>((set, get) => ({
  coords: null,
  setCoords: (c) => set({ coords: c }),

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
      const existing = s.orderList.items.find((i) => i.menu_item_id === menuItemId);
      if (existing) {
        return {
          orderList: {
            ...s.orderList,
            items: s.orderList.items.map((i) =>
              i.menu_item_id === menuItemId ? { ...i, quantity: i.quantity + 1 } : i,
            ),
          },
        };
      }
      return {
        orderList: {
          ...s.orderList,
          items: [
            ...s.orderList.items,
            { menu_item_id: menuItemId, quantity: 1, notes: null, assigned_to: null },
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
        items: s.orderList.items.filter((i) => i.menu_item_id !== menuItemId),
      },
    })),
  clearOrderList: () => set({ orderList: { locationId: null, items: [] } }),
}));
