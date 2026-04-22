import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-olive-gray">Loading…</p>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
