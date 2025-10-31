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

interface RawServerMessage extends Partial<ChatMessage> {
  text?: string;
  message?: string;
  sender?: {
    id?: string;
    displayName?: string;
  };
  [key: string]: unknown;
}

interface ServerToClientEvents {
  newMessage: (message: RawServerMessage) => void;
}

interface ClientToServerEvents {
  joinOrder: (payload: { orderId: string }) => void;
  sendMessage: (payload: { orderId: string; text: string }) => void;
}

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

function normalizeServerMessage(
  raw: RawServerMessage,
  fallbackOrderId: string,
): ChatMessage {
  const normalizedOrderId =
    typeof raw.orderId === "string" && raw.orderId.length > 0
      ? raw.orderId
      : fallbackOrderId;

  const normalizedCreatedAt =
    typeof raw.createdAt === "string" && raw.createdAt.length > 0
      ? raw.createdAt
      : new Date().toISOString();

  const senderIdCandidate =
    typeof raw.senderId === "string"
      ? raw.senderId
      : typeof raw.sender?.id === "string"
      ? raw.sender.id
      : "unknown";

  const senderNameCandidate =
    typeof raw.senderName === "string"
      ? raw.senderName
      : typeof raw.sender?.displayName === "string"
      ? raw.sender.displayName
      : undefined;

  const contentCandidate =
    typeof raw.content === "string"
      ? raw.content
      : typeof raw.text === "string"
      ? raw.text
      : typeof raw.message === "string"
      ? raw.message
      : "";

  const normalizedId =
    typeof raw.id === "string" && raw.id.length > 0
      ? raw.id
      : `${normalizedOrderId}-${senderIdCandidate}-${normalizedCreatedAt}`;

  return {
    id: normalizedId,
    orderId: normalizedOrderId,
    content: contentCandidate,
    senderId: senderIdCandidate,
    senderName: senderNameCandidate,
    createdAt: normalizedCreatedAt,
  };
}

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
      socket.emit("joinOrder", { orderId });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      setConnectionError(error?.message ?? "Не удалось подключиться к чату.");
    });

    socket.on("newMessage", (message) => {
      const normalized = normalizeServerMessage(message, orderId);

      setMessages((prev) => {
        const alreadyExists = prev.some((item) => item.id === normalized.id);
        if (alreadyExists) {
          return prev;
        }

        const nextMessages = [...prev, normalized];
        return nextMessages.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
    });

    return () => {
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

      socketRef.current.emit("sendMessage", { orderId, text: trimmed });
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
