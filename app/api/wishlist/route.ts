import { handleRoute } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { WishlistService } from "@/lib/services/wishlist.service";

/** Current user's wishlist (auto-created). */
export const GET = handleRoute(async () => {
  const { userId } = await requireUser();
  return Response.json(await WishlistService.getOrCreateWishlist(userId));
});

/** Clear the wishlist. */
export const DELETE = handleRoute(async () => {
  const { userId } = await requireUser();
  return Response.json(await WishlistService.clearWishlist(userId));
});
