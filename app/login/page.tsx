import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in · Avantaria Store" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-foreground/10 p-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-foreground/60">Use your Avantaria Store account.</p>
        </div>
        {/* useSearchParams reads the request URL, so it needs a Suspense boundary. */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
