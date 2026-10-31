import { handleRoute } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/guards";
import { UserService } from "@/lib/services/user.service";
import {
  getUserByIdSchema,
  updateUserRoleSchema,
} from "@/lib/validators/user.schema";

type Ctx = { params: Promise<{ id: string }> };

/** Admin: single user. */
export const GET = handleRoute<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  const { id } = getUserByIdSchema.parse(await params);
  return Response.json({ user: await UserService.getUserById(id) });
});

/** Admin: change a user's role. */
export const PATCH = handleRoute<Ctx>(async (req, { params }) => {
  const session = await requireAdmin();
  const { id } = getUserByIdSchema.parse(await params);
  const data = updateUserRoleSchema.parse(await req.json());
  return Response.json({
    user: await UserService.updateUserRole(id, session.userId, data),
  });
});

/** Admin: delete a user with no orders. */
export const DELETE = handleRoute<Ctx>(async (_req, { params }) => {
  const session = await requireAdmin();
  const { id } = getUserByIdSchema.parse(await params);
  await UserService.deleteUser(id, session.userId);
  return new Response(null, { status: 204 });
});
