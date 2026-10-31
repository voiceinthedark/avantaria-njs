import { handleRoute } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { WishlistService } from "@/lib/services/wishlist.service";
import { addWishlistItemSchema } from "@/lib/validators/wishlist.schema";

/** Add a variant to the wishlist. */
export const POST = handleRoute(async (req) => {
  const { userId } = await requireUser();
  const { body } = addWishlistItemSchema.parse({ body: await req.json() });
  return Response.json(await WishlistService.addItem(userId, body.variantId));
});
