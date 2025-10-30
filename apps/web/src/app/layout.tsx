import type { Metadata } from "next";
import Link from "next/link";
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import CitySelector from "./components/CitySelector";
import { getCities } from "./lib/catalog-api";
import type { City } from "./types/catalog.types";

export const metadata: Metadata = {
  title: "Delovrukah.ru - Сервис поиска мастеров",
  description: "Надежные исполнители для любых бытовых и строительных услуг в вашем городе.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let cities: City[] = [];
  let error: string | null = null;

  try {
    cities = await getCities();
  } catch (e) {
    console.error("Failed to fetch cities in RootLayout:", e);
    error = "Не удалось загрузить список городов.";
  }

  return (
    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    <html lang="ru" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`bg-slate-50 antialiased`}>
        <AuthProvider>
          <div className="min-h-screen text-slate-900">
            <header className="border-b bg-white/80 shadow-sm backdrop-blur sticky top-0 z-10">
              <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/" className="text-xl font-semibold">
                  Delovrukah.ru
                </Link>
                <div className="w-full max-w-xs sm:max-w-sm">
                  <CitySelector initialCities={cities} error={error} />
                </div>
              </div>
            </header>
            <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}