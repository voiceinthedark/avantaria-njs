import { handleRoute } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { CartService } from "@/lib/services/cart.service";

/** Current user's cart (auto-created). */
export const GET = handleRoute(async () => {
  const { userId } = await requireUser();
  return Response.json(await CartService.getOrCreateCart(userId));
});

/** Clear the cart. */
export const DELETE = handleRoute(async () => {
  const { userId } = await requireUser();
  return Response.json(await CartService.clearCart(userId));
});
