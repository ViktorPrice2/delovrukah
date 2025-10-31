import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мои заказы | delovrukah",
};

export default function OrdersPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Мои заказы</h1>
        <p className="text-sm text-neutral-500">
          Здесь появятся ваши заказы, как только они будут доступны.
        </p>
      </header>
    </section>
  );
}
