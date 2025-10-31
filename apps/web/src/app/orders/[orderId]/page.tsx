'use client';

import { FormEvent, use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { useAuth } from "@/app/store/auth.store";
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

  const { messages, initializeMessages, sendMessage, isConnected, connectionError } = useChat(orderId);

  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
      };
    },
    [orderId]
  );

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!token || !user) {
      router.replace("/signin");
      return;
    }

    if (user.role !== "CUSTOMER") {
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
    <div className="space-y-6">
      <OrderDetailsClient orderId={orderId} />

      <section className="mx-auto w-full max-w-3xl space-y-4 rounded-lg border bg-white p-6 shadow-sm">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold">Чат по заказу</h2>
          <p className="text-sm text-neutral-500">
            {isConnected ? "Вы подключены к чату." : "Подключаемся к чату..."}
          </p>
        </header>

        {historyError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{historyError}</div>
        ) : null}

        {sendError && !historyError ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{sendError}</div>
        ) : null}

        <div className="flex flex-col gap-4">
          <div className="h-80 space-y-3 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            {historyLoading ? (
              <p className="text-sm text-neutral-500">Загрузка истории сообщений...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-neutral-500">Сообщений пока нет. Напишите первое сообщение.</p>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.senderId && user?.email && message.senderId === user.email;
                const timestampLabel = new Date(message.createdAt).toLocaleString("ru-RU");
                const authorLabel = message.senderName ?? message.senderId;

                return (
                  <div key={message.id} className={`flex flex-col gap-1 ${isOwnMessage ? "items-end text-right" : "items-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                        isOwnMessage
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-neutral-900 shadow"
                      }`}
                    >
                      {message.content}
                    </div>
                    <span className="text-xs text-neutral-500">
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
              className="min-h-[96px] w-full resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Введите сообщение"
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
              disabled={!isConnected}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-neutral-500">
                {isConnected
                  ? "Новое сообщение доставляется мгновенно."
                  : "Ожидание подключения к серверу..."}
              </span>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                disabled={!isConnected || messageDraft.trim().length === 0}
              >
                Отправить
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
