"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/store/auth.store";

const navigation = [
  { href: "/admin/services", label: "Услуги" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isLoading } = useAuth((state) => ({
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
  }));

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!token || !user) {
      router.replace("/signin");
      return;
    }

    if (user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [isLoading, router, token, user]);

  if (isLoading) {
    return <div className="p-6 text-sm text-slate-500">Загрузка...</div>;
  }

  if (!token || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100/60">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-200 bg-white/90 px-6 py-8 shadow-sm lg:w-72 lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-slate-400">Администрирование</p>
              <p className="text-lg font-semibold text-slate-900">Каталог услуг</p>
              <p className="text-sm text-slate-500">
                Управляйте категориями и шаблонами услуг, обновляйте версии и структуру каталога.
              </p>
            </div>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 bg-white/80 px-6 py-10 shadow-inner sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-5xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
