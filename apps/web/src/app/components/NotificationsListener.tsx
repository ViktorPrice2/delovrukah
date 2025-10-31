'use client';

import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

import { useAuth } from '@/app/store/auth.store';
import { getApiBaseUrl } from '@/lib/get-api-base-url';

interface NotificationPayload {
  senderId?: unknown;
  sender?: {
    id?: unknown;
  };
}

function extractSenderId(payload: NotificationPayload): string | null {
  if (typeof payload.senderId === 'string' && payload.senderId.length > 0) {
    return payload.senderId;
  }

  if (
    payload.sender &&
    typeof payload.sender.id === 'string' &&
    payload.sender.id.length > 0
  ) {
    return payload.sender.id;
  }

  return null;
}

export function NotificationsListener() {
  const { token, userId, incrementUnreadCount } = useAuth((state) => ({
    token: state.token,
    userId: state.user?.id,
    incrementUnreadCount: state.incrementUnreadCount,
  }));
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket: Socket = io(getApiBaseUrl(), {
      transports: ['websocket'],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('notification:new-message', (payload: NotificationPayload) => {
      if (!userId) {
        return;
      }

      const senderId = extractSenderId(payload);
      if (!senderId || senderId === userId) {
        return;
      }

      incrementUnreadCount();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, userId, incrementUnreadCount]);

  return null;
}
