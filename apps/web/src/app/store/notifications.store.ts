import { create } from 'zustand';
import { api } from '@/lib/api';

export interface OrderUnreadSummary {
  orderId: string;
  orderNumber: string;
  unreadInOrder: number;
}

export interface NotificationsSummary {
  totalUnreadCount: number;
  ordersWithUnread: OrderUnreadSummary[];
}

interface NotificationsState {
  data: NotificationsSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<NotificationsSummary | null>;
  setNotifications: (data: NotificationsSummary | null) => void;
  clear: () => void;
}

const emptySummary: NotificationsSummary = {
  totalUnreadCount: 0,
  ordersWithUnread: [],
};

function normalizeSummary(
  payload: NotificationsSummary | null | undefined,
): NotificationsSummary {
  if (!payload) {
    return { ...emptySummary };
  }

  const ordersWithUnread: OrderUnreadSummary[] = Array.isArray(
    payload.ordersWithUnread,
  )
    ? payload.ordersWithUnread
        .map((item) => {
          if (!item || typeof item.orderId !== 'string') {
            return null;
          }

          const orderNumber =
            typeof item.orderNumber === 'string' && item.orderNumber.trim().length > 0
              ? item.orderNumber.trim()
              : item.orderId;

          const unreadInOrder =
            typeof item.unreadInOrder === 'number' && Number.isFinite(item.unreadInOrder)
              ? Math.max(0, Math.trunc(item.unreadInOrder))
              : 0;

          if (unreadInOrder <= 0) {
            return null;
          }

          return {
            orderId: item.orderId,
            orderNumber,
            unreadInOrder,
          } satisfies OrderUnreadSummary;
        })
        .filter((value): value is OrderUnreadSummary => value !== null)
    : [];

  const totalUnreadCountCandidate =
    typeof payload.totalUnreadCount === 'number' &&
    Number.isFinite(payload.totalUnreadCount)
      ? Math.max(0, Math.trunc(payload.totalUnreadCount))
      : undefined;

  const totalUnreadCount =
    typeof totalUnreadCountCandidate === 'number'
      ? totalUnreadCountCandidate
      : ordersWithUnread.reduce((sum, entry) => sum + entry.unreadInOrder, 0);

  return {
    totalUnreadCount,
    ordersWithUnread,
  };
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  data: null,
  isLoading: false,
  error: null,
  fetchNotifications: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<NotificationsSummary>('/auth/me/notifications');
      const summary = normalizeSummary(response.data);
      set({ data: summary, isLoading: false, error: null });
      return summary;
    } catch (error) {
      console.error('Failed to fetch notifications summary:', error);
      set({
        data: { ...emptySummary },
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  },
  setNotifications: (data) => {
    set({ data: normalizeSummary(data), isLoading: false, error: null });
  },
  clear: () => {
    set({ data: { ...emptySummary }, isLoading: false, error: null });
  },
}));
