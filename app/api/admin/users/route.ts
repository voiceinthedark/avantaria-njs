import { handleRoute } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/guards";
import { UserService } from "@/lib/services/user.service";
import { listUsersSchema } from "@/lib/validators/user.schema";

/** Admin: paginated user list. */
export const GET = handleRoute(async (req) => {
  await requireAdmin();
  const query = listUsersSchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );
  return Response.json(await UserService.getUsers(query));
});
