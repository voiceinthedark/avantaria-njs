import "server-only";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

const wishlistInclude = {
  items: {
    include: {
      variant: { include: { product: true } },
    },
  },
} as const;

export class WishlistService {
  /** Fetches the user's wishlist, creating an empty one if needed. */
  static async getOrCreateWishlist(userId: string) {
    return prisma.wishlist.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: wishlistInclude,
    });
  }

  /** Adds a variant to the wishlist if it isn't already present. */
  static async addItem(userId: string, variantId: string) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) throw AppError.notFound("Product variant not found");

    const wishlist = await WishlistService.getOrCreateWishlist(userId);

    await prisma.wishlistItem.upsert({
      where: { wishlistId_variantId: { wishlistId: wishlist.id, variantId } },
      update: {},
      create: { wishlistId: wishlist.id, variantId },
    });

    return WishlistService.getOrCreateWishlist(userId);
  }

  /** Removes a variant from the wishlist. */
  static async removeItem(userId: string, variantId: string) {
    const wishlist = await WishlistService.getOrCreateWishlist(userId);
    const item = wishlist.items.find((i) => i.variantId === variantId);
    if (!item) throw AppError.notFound("Item not found in wishlist");

    await prisma.wishlistItem.delete({ where: { id: item.id } });

    return WishlistService.getOrCreateWishlist(userId);
  }

  /** Clears all items from the wishlist. */
  static async clearWishlist(userId: string) {
    const wishlist = await WishlistService.getOrCreateWishlist(userId);
    await prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id },
    });
    return WishlistService.getOrCreateWishlist(userId);
  }
}
