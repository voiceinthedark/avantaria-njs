import { handleRoute } from "@/lib/errors";
import { requireStaff } from "@/lib/auth/guards";
import { OrderService } from "@/lib/services/order.service";
import { updateOrderStatusSchema } from "@/lib/validators/order.schema";

type Ctx = { params: Promise<{ id: string }> };

/** Admin/Staff: update order and/or payment status. */
export const PATCH = handleRoute<Ctx>(async (req, { params }) => {
  await requireStaff();
  const { id, status, paymentStatus } = updateOrderStatusSchema.parse({
    ...(await req.json()),
    ...(await params),
  });
  return Response.json(
    await OrderService.updateOrderStatus(id, { status, paymentStatus }),
  );
});
