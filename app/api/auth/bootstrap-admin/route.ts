import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { AppError, handleRoute } from "@/lib/errors";
import { createSession } from "@/lib/auth/session";
import { AuthService } from "@/lib/services/auth.service";
import { bootstrapAdminSchema } from "@/lib/validators/auth.schema";

const sha256 = (value: string) => createHash("sha256").update(value).digest();

/**
 * Temporary: creates the very first ADMIN account. Requires the
 * `x-bootstrap-key` header to match ADMIN_BOOTSTRAP_KEY and refuses to
 * run once any ADMIN exists. Remove this route (and the env var) after
 * initial setup.
 */
export const POST = handleRoute(async (req) => {
  if (!env.ADMIN_BOOTSTRAP_KEY) {
    throw AppError.forbidden("Admin bootstrap is not configured");
  }

  const provided = req.headers.get("x-bootstrap-key");
  if (
    !provided ||
    !timingSafeEqual(sha256(provided), sha256(env.ADMIN_BOOTSTRAP_KEY))
  ) {
    throw AppError.forbidden("Invalid or missing bootstrap key");
  }

  const data = bootstrapAdminSchema.parse(await req.json());
  const user = await AuthService.bootstrapAdmin(data);
  await createSession({ userId: user.id, role: user.role });
  return Response.json({ user }, { status: 201 });
});
