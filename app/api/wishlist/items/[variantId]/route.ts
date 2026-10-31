import { handleRoute } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { WishlistService } from "@/lib/services/wishlist.service";
import { removeWishlistItemSchema } from "@/lib/validators/wishlist.schema";

type Ctx = { params: Promise<{ variantId: string }> };

/** Remove a variant from the wishlist. */
export const DELETE = handleRoute<Ctx>(async (_req, { params }) => {
  const { userId } = await requireUser();
  const { params: p } = removeWishlistItemSchema.parse({
    params: await params,
  });
  return Response.json(await WishlistService.removeItem(userId, p.variantId));
});
