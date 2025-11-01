"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { api } from "@/lib/api";
import { AdminCategory, ServiceFormPayload } from "../types";
import { ServiceForm } from "../components/ServiceForm";

export default function AdminServiceCreatePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      setIsLoading(true);
      try {
        const response = await api.get<AdminCategory[]>("/admin/categories");
        if (!isMounted) {
          return;
        }
        setCategories(response.data);
      } catch (loadError) {
        console.error(loadError);
        if (!isMounted) {
          return;
        }
        setError("Не удалось загрузить категории. Попробуйте позже.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (payload: ServiceFormPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post("/admin/services", payload);
      router.push("/admin/services");
    } catch (submitError) {
      console.error(submitError);
      let message = "Не удалось создать услугу. Попробуйте повторить попытку.";
      if (axios.isAxiosError(submitError)) {
        message =
          typeof submitError.response?.data?.message === "string"
            ? submitError.response?.data?.message
            : Array.isArray(submitError.response?.data?.message)
              ? submitError.response?.data?.message.join("\n")
              : message;
      } else if (submitError instanceof Error && submitError.message) {
        message = submitError.message;
      }
      setError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Новая услуга</h1>
        <p className="mt-1 text-sm text-slate-500">
          Заполните форму, чтобы создать шаблон услуги и первую активную версию.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500 shadow-sm">
          Загрузка категорий...
        </div>
      ) : (
        <ServiceForm
          categories={categories}
          submitLabel="Создать услугу"
          isSubmitting={isSubmitting}
          errorMessage={error}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
