"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuthStore } from "@/app/store/auth.store";

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
    fullName: z
      .string()
      .min(2, "Имя должно содержать минимум 2 символа")
      .max(100, "Имя слишком длинное"),
    confirmPassword: z
      .string()
      .min(1, "Повторите пароль")
      .min(MIN_PASSWORD_LENGTH, `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`),
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

const API_ENDPOINTS: Record<AuthMode, string> = {
  signin: "/api/auth/signin",
  signup: "/api/auth/signup",
};

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
  redirectTo,
}: AuthFormProps) {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [serverError, setServerError] = useState<string | null>(null);

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
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    const endpoint = API_ENDPOINTS[mode];
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

    const payload =
      mode === "signup"
        ? {
            email: values.email,
            password: values.password,
            fullName: values.fullName?.trim(),
          }
        : {
            email: values.email,
            password: values.password,
          };

    try {
      const response = await axios.post(endpoint, payload, {
        baseURL: baseURL && baseURL.length > 0 ? baseURL : undefined,
      });
      const { token, user } = response.data ?? {};

      if (!token || !user) {
        throw new Error("Некорректный ответ сервера");
      }

      login({ token, user, persist: true });
      router.replace(redirectTo ?? "/profile");
    } catch (error) {
      console.error("Ошибка аутентификации", error);

      if (axios.isAxiosError(error)) {
        const message =
          (error.response?.data as { message?: string })?.message ??
          "Не удалось выполнить запрос. Попробуйте снова.";
        setServerError(message);
        return;
      }

      setServerError(
        error instanceof Error
          ? error.message
          : "Произошла непредвиденная ошибка"
      );
    }
  });

  const title =
    heading ?? (mode === "signup" ? "Регистрация" : "Вход в аккаунт");
  const hint =
    description ??
    (mode === "signup"
      ? "Создайте учетную запись, чтобы пользоваться сервисом"
      : "Введите свои учетные данные");
  const submitText =
    submitLabel ?? (mode === "signup" ? "Зарегистрироваться" : "Войти");

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
