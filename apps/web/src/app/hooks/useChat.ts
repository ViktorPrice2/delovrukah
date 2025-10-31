'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";

import { getApiBaseUrl } from "@/lib/get-api-base-url";
import { useAuth } from "@/app/store/auth.store";

export interface ChatMessage {
  id: string;
  orderId: string;
  content: string;
  senderId: string;
  senderName?: string;
  createdAt: string;
}

interface JoinRoomPayload {
  orderId: string;
}

interface SendMessagePayload {
  orderId: string;
  content: string;
}

interface ServerToClientEvents {
  messageToClient: (message: ChatMessage) => void;
}

interface ClientToServerEvents {
  joinRoom: (payload: JoinRoomPayload) => void;
  leaveRoom: (payload: JoinRoomPayload) => void;
  sendMessage: (payload: SendMessagePayload) => void;
}

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useChat(orderId: string | undefined) {
  const token = useAuth((state) => state.token);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<ChatSocket | null>(null);

  useEffect(() => {
    if (!orderId || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket: ChatSocket = io(getApiBaseUrl(), {
      transports: ["websocket"],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setConnectionError(null);
      socket.emit("joinRoom", { orderId });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      setConnectionError(error?.message ?? "Не удалось подключиться к чату.");
    });

    socket.on("messageToClient", (message) => {
      setMessages((prev) => {
        const alreadyExists = prev.some((item) => item.id === message.id);
        if (alreadyExists) {
          return prev;
        }

        const nextMessages = [...prev, message];
        return nextMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
    });

    return () => {
      socket.emit("leaveRoom", { orderId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId, token]);

  const initializeMessages = useCallback((history: ChatMessage[]) => {
    setMessages(
      [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    );
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) {
        return false;
      }

      if (!socketRef.current || !orderId) {
        setConnectionError("Подключение к чату не установлено.");
        return false;
      }

      socketRef.current.emit("sendMessage", { orderId, content: trimmed });
      return true;
    },
    [orderId]
  );

  return {
    messages,
    initializeMessages,
    sendMessage,
    isConnected,
    connectionError,
  };
}
