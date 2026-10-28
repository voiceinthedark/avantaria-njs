import { handleRoute } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { AuthService } from "@/lib/services/auth.service";

/** Returns the signed-in user (fresh from the database). */
export const GET = handleRoute(async () => {
  const { userId } = await requireUser();
  const user = await AuthService.getCurrentUser(userId);
  return Response.json({ user });
});
