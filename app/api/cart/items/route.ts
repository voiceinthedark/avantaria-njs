import { handleRoute } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { CartService } from "@/lib/services/cart.service";
import { addCartItemSchema } from "@/lib/validators/cart.schema";

/** Add an item (or increment quantity if already present). */
export const POST = handleRoute(async (req) => {
  const { userId } = await requireUser();
  const { body } = addCartItemSchema.parse({ body: await req.json() });
  return Response.json(
    await CartService.addItem(userId, body.variantId, body.quantity),
  );
});
