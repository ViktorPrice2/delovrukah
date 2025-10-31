"use client";

import { FormEvent, use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { useAuth } from "@/app/store/auth.store";
import { useNotificationsStore } from "@/app/store/notifications.store";
import { useChat, type ChatMessage } from "@/app/hooks/useChat";

import { OrderDetailsClient } from "./OrderDetailsClient";

interface OrderPageParams {
  orderId: string;
}

interface OrderPageProps {
  params: Promise<OrderPageParams>;
}

interface RawChatMessage extends Partial<ChatMessage> {
  message?: string;
  text?: string;
  sender?: {
    id?: string;
    displayName?: string;
  };
  [key: string]: unknown;
}

export default function OrderDetailsPage({ params }: OrderPageProps) {
  const { orderId } = use(params);
  const router = useRouter();
  const { user, token, isLoading } = useAuth((state) => ({
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
  }));
  const refreshNotifications = useNotificationsStore(
    (state) => state.fetchNotifications,
  );

  const {
    messages,
    initializeMessages,
    markMessagesAsReadLocally,
    sendMessage,
    isConnected,
    connectionError,
  } = useChat(orderId);

  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const readMessageIdsRef = useRef<Set<string>>(new Set());
  const processingMessageIdsRef = useRef<Set<string>>(new Set());
  const pendingMessageIdsRef = useRef<string[]>([]);

  const normalizeMessage = useCallback(
    (raw: RawChatMessage): ChatMessage => {
      const normalizedOrderId =
        typeof raw.orderId === "string" && raw.orderId.length > 0 ? raw.orderId : orderId;
      const normalizedCreatedAt =
        typeof raw.createdAt === "string" && raw.createdAt.length > 0
          ? raw.createdAt
          : new Date().toISOString();

      const contentCandidate =
        typeof raw.content === "string"
          ? raw.content
          : typeof raw.message === "string"
          ? raw.message
          : typeof raw.text === "string"
          ? raw.text
          : "";

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
        isRead: typeof raw.isRead === "boolean" ? raw.isRead : false,
      };
    },
    [orderId],
  );

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!token || !user) {
      router.replace("/signin");
      return;
    }

    const isCustomerOrProvider =
      user.role === "CUSTOMER" || user.role === "PROVIDER";

    if (!isCustomerOrProvider) {
      router.replace("/");
      return;
    }

    const fetchHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      initializeMessages([]);

      try {
        const response = await api.get<RawChatMessage[]>(`/orders/${orderId}/messages`);
        const history = (response.data ?? []).map((item) => normalizeMessage(item));
        initializeMessages(history);
      } catch (error) {
        console.error("Failed to load chat history", error);
        setHistoryError("Не удалось загрузить историю сообщений. Попробуйте обновить страницу.");
        initializeMessages([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [initializeMessages, isLoading, normalizeMessage, orderId, router, token, user]);

  useEffect(() => {
    if (connectionError) {
      setSendError(connectionError);
    } else {
      setSendError(null);
    }
  }, [connectionError]);

  useEffect(() => {
    if (!messagesEndRef.current) {
      return;
    }

    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    readMessageIdsRef.current = new Set();
    processingMessageIdsRef.current = new Set();
    pendingMessageIdsRef.current = [];
  }, [orderId]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const unreadIds = messages
      .filter(
        (message) =>
          message.senderId !== user.id &&
          message.isRead === false &&
          !readMessageIdsRef.current.has(message.id) &&
          !processingMessageIdsRef.current.has(message.id),
      )
      .map((message) => message.id);

    if (unreadIds.length === 0) {
      return;
    }

    const uniqueUnreadIds = Array.from(
      new Set([...pendingMessageIdsRef.current, ...unreadIds]),
    );
    pendingMessageIdsRef.current = uniqueUnreadIds;

    if (processingMessageIdsRef.current.size > 0) {
      return;
    }

    const processUnreadMessages = async () => {
      const batch = pendingMessageIdsRef.current;
      pendingMessageIdsRef.current = [];

      if (batch.length === 0) {
        return;
      }

      batch.forEach((id) => processingMessageIdsRef.current.add(id));

      try {
        await api.post(`/orders/${orderId}/messages/read`);
        batch.forEach((id) => {
          processingMessageIdsRef.current.delete(id);
          readMessageIdsRef.current.add(id);
        });
        markMessagesAsReadLocally(batch);
        await refreshNotifications();
      } catch (error) {
        console.error("Failed to mark messages as read", error);
        batch.forEach((id) => {
          processingMessageIdsRef.current.delete(id);
        });
      } finally {
        if (pendingMessageIdsRef.current.length > 0) {
          void processUnreadMessages();
        }
      }
    };

    void processUnreadMessages();
  }, [
    messages,
    user?.id,
    orderId,
    markMessagesAsReadLocally,
    refreshNotifications,
  ]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const wasSent = sendMessage(messageDraft);
    if (!wasSent) {
      setSendError("Не удалось отправить сообщение. Проверьте подключение и попробуйте снова.");
      return;
    }

    setSendError(null);
    setMessageDraft("");
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Коммуникация по заказу
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">Детали заказа и чат</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Отслеживайте прогресс выполнения и поддерживайте связь с другой стороной сделки в режиме реального времени.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div className="lg:sticky lg:top-8">
            <OrderDetailsClient
              orderId={orderId}
              className="lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto"
            />
          </div>

          <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
            <header className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900">Чат по заказу</h2>
              <p className="text-sm text-slate-500">
                {isConnected ? "Вы подключены к чату." : "Подключаемся к чату..."}
              </p>
            </header>

            {historyError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
                {historyError}
              </div>
            ) : null}

            {sendError && !historyError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
                {sendError}
              </div>
            ) : null}

            <div className="flex flex-col gap-4">
              <div className="h-96 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                {historyLoading ? (
                  <p className="text-sm text-slate-500">Загрузка истории сообщений...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-slate-500">Сообщений пока нет. Напишите первое сообщение.</p>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage =
                      message.senderId && user?.id && message.senderId === user.id;
                    const timestampLabel = new Date(message.createdAt).toLocaleString("ru-RU");
                    const authorLabel = message.senderName ?? message.senderId;

                    return (
                      <div
                        key={message.id}
                        className={`flex flex-col gap-1 ${isOwnMessage ? "items-end text-right" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                            isOwnMessage
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-slate-900"
                          }`}
                        >
                          {message.content}
                        </div>
                        <span className="text-xs text-slate-400">
                          {authorLabel ? `${authorLabel} · ` : ""}
                          {timestampLabel}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <textarea
                  className="min-h-[120px] w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Введите сообщение"
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  disabled={!isConnected}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-slate-500">
                    {isConnected
                      ? "Новое сообщение доставляется мгновенно."
                      : "Ожидание подключения к серверу..."}
                  </span>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                    disabled={!isConnected || messageDraft.trim().length === 0}
                  >
                    Отправить
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
