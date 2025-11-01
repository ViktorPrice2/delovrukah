"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { api } from "@/lib/api";
import {
  AdminCategory,
  AdminServiceTemplate,
  ServiceFormPayload,
} from "../../types";
import { ServiceForm } from "../../components/ServiceForm";

export default function AdminServiceEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const serviceId = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [service, setService] = useState<AdminServiceTemplate | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) {
      return;
    }

    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [categoriesResponse, serviceResponse] = await Promise.all([
          api.get<AdminCategory[]>("/admin/categories"),
          api.get<AdminServiceTemplate>(`/admin/services/${serviceId}`),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(categoriesResponse.data);
        setService(serviceResponse.data);
        setError(null);
      } catch (loadError) {
        console.error(loadError);
        if (!isMounted) {
          return;
        }
        setError("Не удалось загрузить данные услуги. Возможно, она была удалена.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [serviceId]);

  const handleSubmit = async (payload: ServiceFormPayload) => {
    if (!serviceId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.put(`/admin/services/${serviceId}`, payload);
      router.push("/admin/services");
    } catch (submitError) {
      console.error(submitError);
      let message = "Не удалось обновить услугу. Попробуйте повторить попытку.";
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

  if (!serviceId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        Некорректный идентификатор услуги.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Редактирование услуги
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Измените данные шаблона и создайте новую версию описания.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500 shadow-sm">
          Загрузка данных услуги...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          {error}
        </div>
      ) : service ? (
        <ServiceForm
          categories={categories}
          initialService={service}
          submitLabel="Сохранить изменения"
          isSubmitting={isSubmitting}
          errorMessage={error}
          onSubmit={handleSubmit}
        />
      ) : (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          Услуга не найдена или была удалена.
        </div>
      )}
    </div>
  );
}
