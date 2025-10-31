"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/store/auth.store";

export default function OrdersLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, token, isLoading } = useAuth((state) => ({
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
  }));

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!token || !user || user.role !== "CUSTOMER") {
      router.replace("/");
    }
  }, [isLoading, token, user, router]);

  if (isLoading) {
    return <div className="p-6">Загрузка...</div>;
  }

  if (!token || !user || user.role !== "CUSTOMER") {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="mx-auto w-full max-w-5xl px-4 py-10">{children}</main>
    </div>
  );
}
