import { handleRoute } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { UserService } from "@/lib/services/user.service";
import { updateProfileSchema } from "@/lib/validators/user.schema";

/** Signed-in user: update own profile. */
export const PATCH = handleRoute(async (req) => {
  const { userId } = await requireUser();
  const data = updateProfileSchema.parse(await req.json());
  return Response.json({ user: await UserService.updateProfile(userId, data) });
});
