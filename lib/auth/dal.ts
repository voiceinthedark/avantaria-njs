import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";
import { AuthService } from "@/lib/services/auth.service";
import { getSession } from "./session";

/**
 * Data Access Layer for Server Components and Server Actions.
 *
 * Unlike the JWT (which keeps the role it was issued with for up to 7 days),
 * this loads the user from the database, so deleted users and role changes
 * take effect immediately. `cache` dedupes the lookup within one request.
 *
 * Reads cookies, so callers must render behind a <Suspense> boundary
 * (Cache Components).
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  try {
    return await AuthService.getCurrentUser(session.userId);
  } catch (error) {
    if (error instanceof AppError && error.status === 401) return null;
    throw error;
  }
});

/** Requires an ADMIN or STAFF user, otherwise redirects. */
export async function requireStaffUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "STAFF") redirect("/");
  return user;
}

/** Requires an ADMIN user, otherwise redirects. */
export async function requireAdminUser() {
  const user = await requireStaffUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
