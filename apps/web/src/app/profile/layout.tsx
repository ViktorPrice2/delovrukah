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
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 border-r bg-white p-6">
        <nav className="space-y-2">
          {availableNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
