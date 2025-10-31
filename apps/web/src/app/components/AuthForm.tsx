// apps/web/src/app/components/AuthForm.tsx

"use client";
import axios from 'axios';
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { jwtDecode } from "jwt-decode";

import { api } from '@/lib/api';
import { useAuth as useAuthStore } from '../store/auth.store';
import { useIsClient } from '@/hooks/useIsClient'; // Убедитесь, что этот файл создан

const MIN_PASSWORD_LENGTH = 8;

const signinSchema = z.object({
  email: z
    .string()
    .min(1, "Введите email")
    .email("Введите корректный email"),
  password: z
    .string()
    .min(1, "Введите пароль")
    .min(MIN_PASSWORD_LENGTH, `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`),
});

const signupSchema = signinSchema
  .extend({
    // Мы ожидаем fullName, а на бэкенд отправим displayName
    fullName: z
      .string()
      .min(2, "Имя должно содержать минимум 2 символа")
      .max(100, "Имя слишком длинное"),
    confirmPassword: z
      .string()
      .min(1, "Повторите пароль")
      .min(MIN_PASSWORD_LENGTH, `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`),
    role: z.enum(["CUSTOMER", "PROVIDER"], {
      required_error: "Выберите роль",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type AuthMode = "signin" | "signup";

type SigninValues = z.infer<typeof signinSchema>;
type SignupValues = z.infer<typeof signupSchema>;
type AuthFormValues = SigninValues &
  Partial<Omit<SignupValues, keyof SigninValues>>;

interface AuthFormProps {
  mode: AuthMode;
  heading?: string;
  description?: string;
  submitLabel?: string;
  redirectTo?: string;
}

const resolveSchema = (mode: AuthMode) =>
  mode === "signup" ? signupSchema : signinSchema;

export function AuthForm({
  mode,
  heading,
  description,
  submitLabel,
}: AuthFormProps) {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [serverError, setServerError] = useState<string | null>(null);
  const isClient = useIsClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(resolveSchema(mode)),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      confirmPassword: "",
      role: "CUSTOMER",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null); // Сбрасываем предыдущие ошибки сервера

    const endpoint = mode === 'signup' ? '/auth/signup' : '/auth/signin';

    // Формируем payload в зависимости от режима (регистрация или вход)
    const payload =
      mode === "signup"
        ? {
            email: values.email,
            password: values.password,
            displayName: values.fullName?.trim(), // displayName для исполнителя
            fullName: values.fullName?.trim(), // fullName для заказчика
            role: values.role ?? "CUSTOMER",
          }
        : {
            email: values.email,
            password: values.password,
          };

    try {
      const response = await api.post(endpoint, payload);
      const token = response.data?.access_token;

      if (!token) {
        // Эта ошибка скорее для нашей отладки, пользователь ее не увидит
        throw new Error("Некорректный ответ сервера: токен не получен.");
      }

      // Декодируем токен, чтобы получить базовую информацию о пользователе
      const decodedToken: {
        sub: string;
        email: string;
        role: 'CUSTOMER' | 'PROVIDER';
      } = jwtDecode(token);

      // Вызываем действие `login` из нашего Zustand store
      login({
        token,
        user: {
          id: decodedToken.sub,
          email: decodedToken.email,
          role: decodedToken.role,
        },
      });

      // Перенаправляем пользователя на страницу в зависимости от роли
      const redirectPath =
        decodedToken.role === 'PROVIDER' ? '/profile' : '/orders';
      router.push(redirectPath);

    } catch (error) {
      // ПРАВИЛЬНАЯ ОБРАБОТКА ДЛЯ ТИПА 'unknown'
      if (axios.isAxiosError(error) && error.response) {
        // Теперь TypeScript уверен, что 'error' - это AxiosError
        // и у него есть свойство 'response'
        console.error('Ошибка API:', error.response.data);
        
        // Получаем сообщение об ошибке. Оно может быть в error.response.data.message
        const errorMessage = error.response.data?.message || 'Произошла ошибка при запросе к серверу.';
        setServerError(errorMessage);
        
      } else {
        // Обработка всех остальных видов ошибок
        console.error('Произошла неизвестная ошибка:', error);
        setServerError('Произошла непредвиденная ошибка. Проверьте подключение к сети.');
      }
    }
  });

  const title = heading ?? (mode === "signup" ? "Регистрация" : "Вход в аккаунт");
  const hint = description ?? (mode === "signup" ? "Создайте учетную запись" : "Введите свои данные");
  const submitText = submitLabel ?? (mode === "signup" ? "Зарегистрироваться" : "Войти");

  // Отложенный рендеринг для решения проблемы гидратации
  if (!isClient) {
    // Можно вернуть скелет-загрузчик для лучшего UX
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-neutral-200 bg-white/80 p-8 shadow-sm backdrop-blur animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded w-full mx-auto"></div>
        <div className="flex flex-col gap-5 mt-5">
            <div className="h-14 bg-gray-200 rounded-lg"></div>
            <div className="h-14 bg-gray-200 rounded-lg"></div>
            {mode === 'signup' && <div className="h-14 bg-gray-200 rounded-lg"></div>}
            <div className="h-11 bg-gray-300 rounded-lg mt-1"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-neutral-200 bg-white/80 p-8 shadow-sm backdrop-blur">
      <header className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        <p className="text-sm text-neutral-500">{hint}</p>
      </header>

      <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
        <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
          Email
          <input
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-base text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
            {...register("email")}
          />
          {errors.email && (
            <span className="text-sm font-normal text-red-500">
              {errors.email.message}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
          Пароль
          <input
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="Введите пароль"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-base text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
            {...register("password")}
          />
          {errors.password && (
            <span className="text-sm font-normal text-red-500">
              {errors.password.message}
            </span>
          )}
        </label>

        {mode === "signup" && (
          <>
            <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
              Имя
              <input
                type="text"
                autoComplete="name"
                placeholder="Как к вам обращаться"
                className="rounded-lg border border-neutral-300 px-3 py-2 text-base text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                {...register("fullName")}
              />
              {errors.fullName && (
                <span className="text-sm font-normal text-red-500">
                  {errors.fullName.message}
                </span>
              )}
            </label>

            <fieldset className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
              <legend className="text-sm font-medium text-neutral-700">
                Выберите вашу роль
              </legend>
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="radio"
                  value="CUSTOMER"
                  className="h-4 w-4 border-neutral-300 text-neutral-900 focus:ring-neutral-900/10"
                  {...register("role")}
                />
                Я — Заказчик
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="radio"
                  value="PROVIDER"
                  className="h-4 w-4 border-neutral-300 text-neutral-900 focus:ring-neutral-900/10"
                  {...register("role")}
                />
                Я — Исполнитель
              </label>
              {errors.role && (
                <span className="text-sm font-normal text-red-500">
                  {errors.role.message}
                </span>
              )}
            </fieldset>

            <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
              Подтверждение пароля
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Повторите пароль"
                className="rounded-lg border border-neutral-300 px-3 py-2 text-base text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <span className="text-sm font-normal text-red-500">
                  {errors.confirmPassword.message}
                </span>
              )}
            </label>
          </>
        )}

        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
        >
          {isSubmitting ? "Отправка..." : submitText}
        </button>
      </form>

      <footer className="text-center text-sm text-neutral-500">
        {mode === "signup" ? (
          <span>
            Уже есть аккаунт?{" "}
            <Link className="font-semibold text-neutral-900" href="/signin">
              Войдите
            </Link>
          </span>
        ) : (
          <span>
            Нет аккаунта?{" "}
            <Link className="font-semibold text-neutral-900" href="/signup">
              Зарегистрируйтесь
            </Link>
          </span>
        )}
      </footer>
    </div>
  );
}