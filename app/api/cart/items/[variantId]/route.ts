import { handleRoute } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { CartService } from "@/lib/services/cart.service";
import {
  removeCartItemSchema,
  updateCartItemSchema,
} from "@/lib/validators/cart.schema";

type Ctx = { params: Promise<{ variantId: string }> };

/** Set the exact quantity of a cart item. */
export const PATCH = handleRoute<Ctx>(async (req, { params }) => {
  const { userId } = await requireUser();
  const { variantId, quantity } = updateCartItemSchema.parse({
    ...(await req.json()),
    ...(await params),
  });
  return Response.json(
    await CartService.updateItemQuantity(userId, variantId, quantity),
  );
});

/** Remove a cart item. */
export const DELETE = handleRoute<Ctx>(async (_req, { params }) => {
  const { userId } = await requireUser();
  const { variantId } = removeCartItemSchema.parse(await params);
  return Response.json(await CartService.removeItem(userId, variantId));
});
