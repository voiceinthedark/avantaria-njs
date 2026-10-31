import { handleRoute } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { UserService } from "@/lib/services/user.service";
import { changePasswordSchema } from "@/lib/validators/user.schema";

/** Signed-in user: change own password. */
export const PUT = handleRoute(async (req) => {
  const { userId } = await requireUser();
  const data = changePasswordSchema.parse(await req.json());
  await UserService.changePassword(userId, data);
  return new Response(null, { status: 204 });
});
