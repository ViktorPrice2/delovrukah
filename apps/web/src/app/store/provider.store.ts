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
  fetchProfile: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  resetError: () => void;
}

export const useProviderStore = create<ProviderStoreState>((set) => ({
  profile: undefined,
  isLoading: false,
  isUpdating: false,
  error: undefined,
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
}));
