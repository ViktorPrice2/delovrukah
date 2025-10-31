import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { Provider, ServiceDetail } from '@/app/types/catalog.types';

export interface CartItem {
  service: ServiceDetail;
  provider: Provider;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (service: ServiceDetail, provider: Provider, quantity?: number) => void;
  removeItem: (serviceId: string, providerId: string) => void;
  updateItemQuantity: (serviceId: string, providerId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (service, provider, quantity = 1) => {
        if (quantity <= 0) {
          return;
        }

        const sanitizedService: ServiceDetail = {
          ...service,
          providers: undefined,
        };

        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.service.id === service.id && item.provider.id === provider.id,
          );

          if (existingIndex !== -1) {
            const updatedItems = [...state.items];
            const existingItem = updatedItems[existingIndex];
            updatedItems[existingIndex] = {
              ...existingItem,
              quantity: existingItem.quantity + quantity,
            };
            return { items: updatedItems };
          }

          return {
            items: [...state.items, { service: sanitizedService, provider, quantity }],
          };
        });
      },
      removeItem: (serviceId, providerId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.service.id === serviceId && item.provider.id === providerId),
          ),
        }));
      },
      updateItemQuantity: (serviceId, providerId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(serviceId, providerId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.service.id === serviceId && item.provider.id === providerId) {
              return { ...item, quantity };
            }
            return item;
          }),
        }));
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
