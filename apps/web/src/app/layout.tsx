import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import CurrentCityDisplay from "./components/CurrentCityDisplay";

export const metadata: Metadata = {
  title: "Delovrukah.ru - Сервис поиска мастеров",
  description: "Надежные исполнители для любых бытовых и строительных услуг в вашем городе.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-slate-50 antialiased">
        <AuthProvider>
          <div className="min-h-screen text-slate-900">
            <header className="sticky top-0 z-10 border-b bg-white/80 shadow-sm backdrop-blur">
              <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/" className="text-xl font-semibold">
                  Delovrukah.ru
                </Link>
                <CurrentCityDisplay />
              </div>
            </header>
            <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
