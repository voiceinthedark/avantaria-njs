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
  const { params: p, body } = updateCartItemSchema.parse({
    params: await params,
    body: await req.json(),
  });
  return Response.json(
    await CartService.updateItemQuantity(userId, p.variantId, body.quantity),
  );
});

/** Remove a cart item. */
export const DELETE = handleRoute<Ctx>(async (_req, { params }) => {
  const { userId } = await requireUser();
  const { params: p } = removeCartItemSchema.parse({ params: await params });
  return Response.json(await CartService.removeItem(userId, p.variantId));
});
