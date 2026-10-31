import { handleRoute } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { OrderService } from "@/lib/services/order.service";

/** Customer: own order history. */
export const GET = handleRoute(async () => {
  const { userId } = await requireUser();
  return Response.json(await OrderService.getOrdersForUser(userId));
});
