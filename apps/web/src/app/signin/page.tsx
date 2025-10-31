import Image from "next/image";
import type { Metadata } from "next";

import { AuthForm } from "@/app/components/AuthForm";

export const metadata: Metadata = {
  title: "Вход | delovrukah",
};

export default function SignInPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-neutral-950/5 lg:grid-cols-[1fr_minmax(0,480px)]">
      <div className="relative hidden overflow-hidden bg-neutral-900 lg:block">
        <Image
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80"
          alt="Команда специалистов работает над проектом"
          fill
          priority
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 0vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/40 via-neutral-900/60 to-neutral-900/90" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-wide">
              Платформа delovrukah
            </span>
            <h1 className="text-4xl font-semibold leading-tight">
              Добро пожаловать в пространство для профессионалов и клиентов
            </h1>
          </div>
          <p className="max-w-sm text-sm text-white/70">
            Создавайте проекты, отслеживайте заказы и общайтесь с исполнителями в едином удобном интерфейсе.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold text-neutral-900">Войти в аккаунт</h2>
            <p className="text-sm text-neutral-500">
              Используйте корпоративную почту, чтобы продолжить работу с заказами.
            </p>
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-white/80 p-8 shadow-lg shadow-neutral-900/5 backdrop-blur">
            <AuthForm mode="signin" heading="" description="" />
          </div>
        </div>
      </div>
    </main>
  );
}
