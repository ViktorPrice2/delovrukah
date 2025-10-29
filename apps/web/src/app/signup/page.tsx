import type { Metadata } from "next";

import { AuthForm } from "@/app/components/AuthForm";

export const metadata: Metadata = {
  title: "Регистрация | delovrukah",
};

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <AuthForm mode="signup" />
    </main>
  );
}
