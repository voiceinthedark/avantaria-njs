"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const next = useSearchParams().get("next") ?? "";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.email}
          className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/60"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/60"
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
