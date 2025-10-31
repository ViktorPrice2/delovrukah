import { isAxiosError } from 'axios';
import { create } from 'zustand';
import { api } from '@/lib/api';

export interface ProviderProfile {
  id?: string;
  displayName: string;
  description: string | null;
  cityId: string | number | null;
  cityName?: string | null;
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

interface ProviderCatalogServiceVersionResponse {
  id: string;
  title: string;
  providerPrice?: number | null;
}

interface ProviderCatalogServiceResponse {
  id: string;
  name: string;
  latestVersion: ProviderCatalogServiceVersionResponse | null;
}

interface ProviderCatalogCategoryResponse {
  id: string;
  name: string;
  services: ProviderCatalogServiceResponse[];
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
      if (isAxiosError(error) && error.response?.status === 404) {
        console.info('Provider profile not found, skipping');
        set({ profile: undefined, isLoading: false, error: undefined });
        return;
      }

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
      const response = await api.get<ProviderCatalogCategoryResponse[]>(
        '/provider/prices/catalog',
      );

      const catalogResponse = response.data ?? [];
      const priceCatalog: ProviderPriceCategory[] = catalogResponse.map(
        (category) => ({
          id: category.id,
          name: category.name,
          services: category.services
            .map((service) => {
              const version = service.latestVersion;

              if (!version) {
                return undefined;
              }

              return {
                id: version.id,
                name: service.name,
                providerPrice:
                  version.providerPrice === undefined
                    ? null
                    : version.providerPrice,
              } satisfies ProviderPriceService;
            })
            .filter((service): service is ProviderPriceService => Boolean(service)),
        }),
      );

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

