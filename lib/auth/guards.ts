import "server-only";
import type { Role } from "@store/db";
import { AppError } from "@/lib/errors";
import { getSession, type SessionPayload } from "./session";

/** Requires a signed-in user. Throws 401 otherwise. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw AppError.unauthorized();
  return session;
}

/** Requires a signed-in user with one of the given roles. Throws 401/403. */
export async function requireRole(
  ...roles: [Role, ...Role[]]
): Promise<SessionPayload> {
  const session = await requireUser();
  if (!roles.includes(session.role)) throw AppError.forbidden();
  return session;
}

export const requireAdmin = () => requireRole("ADMIN");
export const requireStaff = () => requireRole("ADMIN", "STAFF");

export function isAdminOrStaff(session: SessionPayload) {
  return session.role === "ADMIN" || session.role === "STAFF";
}
