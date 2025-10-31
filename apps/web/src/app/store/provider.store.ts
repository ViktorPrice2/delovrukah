import { create } from 'zustand';
import { api } from '@/lib/api';

export interface ProviderProfile {
  id?: string;
  displayName: string;
  description: string;
  cityId: string | number;
  cityName?: string;
}

interface UpdateProfilePayload {
  displayName: string;
  description: string;
  cityId: string;
}

interface ProviderStoreState {
  profile?: ProviderProfile;
  isLoading: boolean;
  isUpdating: boolean;
  error?: string;
  priceCatalog: ProviderPriceCategory[];
  isPriceCatalogLoading: boolean;
  priceCatalogError?: string;
  fetchProfile: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  resetError: () => void;
  fetchPriceCatalog: () => Promise<void>;
}

export interface ProviderPriceService {
  id: string;
  name: string;
  providerPrice?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
}

export interface ProviderPriceCategory {
  id: string;
  name: string;
  services: ProviderPriceService[];
}

export const useProviderStore = create<ProviderStoreState>((set) => ({
  profile: undefined,
  isLoading: false,
  isUpdating: false,
  error: undefined,
  priceCatalog: [],
  isPriceCatalogLoading: false,
  priceCatalogError: undefined,
  fetchProfile: async () => {
    set({ isLoading: true, error: undefined });
    try {
      const response = await api.get<ProviderProfile>('/provider/profile');
      set({ profile: response.data, isLoading: false, error: undefined });
    } catch (error) {
      console.error('Failed to load provider profile', error);
      set({ error: 'Не удалось загрузить профиль', isLoading: false });
    }
  },
  updateProfile: async (payload) => {
    set({ isUpdating: true, error: undefined });
    try {
      const response = await api.put<ProviderProfile>('/provider/profile', payload);
      const profile = response.data ?? { ...payload };
      set({ profile, isUpdating: false, error: undefined });
    } catch (error) {
      console.error('Failed to update provider profile', error);
      set({ error: 'Не удалось обновить профиль', isUpdating: false });
      throw error;
    }
  },
  resetError: () => set({ error: undefined }),
  fetchPriceCatalog: async () => {
    set({ isPriceCatalogLoading: true, priceCatalogError: undefined });
    try {
      const response = await api.get<ProviderPriceCategory[]>('/provider/prices/catalog');
      const priceCatalog = response.data ?? [];
      set({ priceCatalog, isPriceCatalogLoading: false, priceCatalogError: undefined });
    } catch (error) {
      console.error('Failed to load provider price catalog', error);
      set({
        priceCatalogError: 'Не удалось загрузить каталог цен',
        isPriceCatalogLoading: false,
      });
    }
  },
}));

