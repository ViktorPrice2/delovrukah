import Image from "next/image";
import type { Metadata } from "next";

import { AuthForm } from "@/app/components/AuthForm";

export const metadata: Metadata = {
  title: "Регистрация | delovrukah",
};

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-neutral-950/5 lg:grid-cols-[1fr_minmax(0,520px)]">
      <div className="relative hidden overflow-hidden bg-neutral-900 lg:block">
        <Image
          src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80"
          alt="Совместная работа специалистов у большого окна"
          fill
          priority
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 0vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 via-neutral-950/60 to-neutral-950/90" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-wide">
              Начните с delovrukah
            </span>
            <h1 className="text-4xl font-semibold leading-tight">
              Создайте профиль и находите клиентов, готовых к сотрудничеству
            </h1>
          </div>
          <p className="max-w-sm text-sm text-white/70">
            Заполните основные данные, чтобы получить доступ к инструментам платформы для заказчиков и исполнителей.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold text-neutral-900">Создать учетную запись</h2>
            <p className="text-sm text-neutral-500">
              Зарегистрируйтесь как заказчик или исполнитель и начните сотрудничество.
            </p>
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-white/85 p-8 shadow-lg shadow-neutral-900/5 backdrop-blur">
            <AuthForm
              mode="signup"
              heading=""
              description="Создайте учетную запись и выберите подходящую роль"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
