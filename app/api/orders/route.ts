import { handleRoute } from "@/lib/errors";
import { requireStaff, requireUser } from "@/lib/auth/guards";
import { OrderService } from "@/lib/services/order.service";
import { createOrderSchema, listOrdersSchema } from "@/lib/validators/order.schema";

/** Admin/Staff: paginated list of all orders (filters via query string). */
export const GET = handleRoute(async (req) => {
  await requireStaff();
  const query = listOrdersSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return Response.json(await OrderService.getAllOrders(query));
});

/** Customer: create an order (pay-on-delivery). */
export const POST = handleRoute(async (req) => {
  const { userId } = await requireUser();
  const data = createOrderSchema.parse(await req.json());
  return Response.json(await OrderService.createOrder(userId, data), {
    status: 201,
  });
});
