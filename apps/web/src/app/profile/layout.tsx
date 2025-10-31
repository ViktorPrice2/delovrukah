"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/app/store/auth.store";
import { useProviderStore } from "@/app/store/provider.store";

const navigation = [
  { href: "/profile", label: "Дашборд" },
  { href: "/profile/settings", label: "Настройки" },
  { href: "/profile/prices", label: "Цены" },
];

export default function ProfileLayout({
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
  const { profile, isLoading: isProfileLoading, fetchProfile } = useProviderStore(
    (state) => ({
      profile: state.profile,
      isLoading: state.isLoading,
      fetchProfile: state.fetchProfile,
    }),
  );

  const requiresProfileOnboarding =
    user?.role === "PROVIDER" && (!profile || !profile.displayName?.trim());

  useEffect(() => {
    if (!token || !user || user.role !== "PROVIDER") {
      return;
    }

    if (!pathname?.startsWith("/profile")) {
      return;
    }

    if (profile || isProfileLoading) {
      return;
    }

    fetchProfile().catch(() => undefined);
  }, [fetchProfile, isProfileLoading, pathname, profile, token, user]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!pathname?.startsWith("/profile")) {
      return;
    }

    if (!token || !user || user.role !== "PROVIDER") {
      router.replace("/");
      return;
    }

    if (requiresProfileOnboarding && pathname !== "/profile/settings") {
      router.replace("/profile/settings");
    }
  }, [
    isLoading,
    pathname,
    requiresProfileOnboarding,
    router,
    token,
    user,
  ]);

  if (isLoading) {
    return <div className="p-6">Загрузка...</div>;
  }

  if (!token || !user || user.role !== "PROVIDER") {
    return null;
  }

  const availableNavigation = requiresProfileOnboarding
    ? navigation.filter((item) => item.href === "/profile/settings")
    : navigation;

  return (
    <div className="min-h-screen bg-slate-100/60">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <aside className="relative w-full border-b border-slate-200 bg-white/90 px-6 py-8 shadow-sm lg:w-72 lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
          <div className="flex flex-col gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full bg-indigo-50/80 px-4 py-2 text-sm font-semibold text-indigo-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">DR</span>
                Кабинет исполнителя
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate-400">Аккаунт</p>
                <p className="text-lg font-semibold text-slate-900">
                  {profile?.displayName || user.email}
                </p>
                <p className="text-sm text-slate-500">
                  {profile?.cityName ?? profile?.cityId ?? "Город не указан"}
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              {availableNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs uppercase tracking-wide">
                      {isActive ? "Сейчас" : ""}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-xs text-indigo-600">
              <p className="font-semibold">Подсказка</p>
              <p className="mt-2 leading-relaxed">
                Обновляйте профиль и цены, чтобы подчеркивать профессионализм и получать больше откликов от клиентов.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 bg-white/70 px-6 py-10 shadow-inner sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-4xl space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
