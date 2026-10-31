import { handleRoute } from "@/lib/errors";
import { requireStaff, requireUser } from "@/lib/auth/guards";
import { OrderService } from "@/lib/services/order.service";
import { createOrderSchema } from "@/lib/validators/order.schema";

/** Admin/Staff: list all orders. */
export const GET = handleRoute(async () => {
  await requireStaff();
  return Response.json(await OrderService.getAllOrders());
});

/** Customer: create an order (pay-on-delivery). */
export const POST = handleRoute(async (req) => {
  const { userId } = await requireUser();
  const data = createOrderSchema.parse(await req.json());
  return Response.json(await OrderService.createOrder(userId, data), {
    status: 201,
  });
});
