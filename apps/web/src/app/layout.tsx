import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import Header from "./components/Header";
import { NotificationsListener } from "./components/NotificationsListener";

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
          <NotificationsListener />
          <div className="min-h-screen text-slate-900">
            <Header />
            <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
