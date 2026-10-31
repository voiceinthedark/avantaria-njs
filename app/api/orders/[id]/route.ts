import { handleRoute } from "@/lib/errors";
import { isAdminOrStaff, requireUser } from "@/lib/auth/guards";
import { OrderService } from "@/lib/services/order.service";
import { getOrderByIdSchema } from "@/lib/validators/order.schema";

type Ctx = { params: Promise<{ id: string }> };

/** Owner or Admin/Staff: single order. */
export const GET = handleRoute<Ctx>(async (_req, { params }) => {
  const session = await requireUser();
  const { id } = getOrderByIdSchema.parse(await params);
  return Response.json(
    await OrderService.getOrderById(id, session.userId, isAdminOrStaff(session)),
  );
});
