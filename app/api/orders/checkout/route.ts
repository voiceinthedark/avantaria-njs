import { handleRoute } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { OrderService } from "@/lib/services/order.service";
import { checkoutSchema } from "@/lib/validators/order.schema";

/** Customer: place an order from the current cart. */
export const POST = handleRoute(async (req) => {
  const { userId } = await requireUser();
  const { addressId } = checkoutSchema.parse(await req.json());
  return Response.json(await OrderService.checkoutFromCart(userId, addressId), {
    status: 201,
  });
});
