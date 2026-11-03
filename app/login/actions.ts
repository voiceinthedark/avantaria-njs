"use server";

import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";
import { createSession } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { loginSchema } from "@/lib/validators/auth.schema";

export type LoginState = { error: string; email: string } | undefined;

/**
 * Only allow same-site relative redirects. Rejects absolute URLs and
 * protocol-relative ones ("//evil.com", "/\evil.com") to avoid open redirects.
 */
function safeRedirectTarget(next: FormDataEntryValue | null, fallback: string) {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");

  const parsed = loginSchema.safeParse({
    email,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password.", email };
  }

  let user;
  try {
    user = await AuthService.login(parsed.data);
  } catch (error) {
    if (error instanceof AppError && error.status === 401) {
      return { error: "Invalid email or password.", email };
    }
    throw error;
  }

  await createSession({ userId: user.id, role: user.role });

  const isStaff = user.role === "ADMIN" || user.role === "STAFF";
  // redirect() throws, so keep it outside the try/catch above.
  redirect(safeRedirectTarget(formData.get("next"), isStaff ? "/dashboard" : "/"));
}
