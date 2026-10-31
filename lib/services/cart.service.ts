import "server-only";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

const cartInclude = {
  items: {
    include: {
      variant: { include: { product: true } },
    },
  },
} as const;

export class CartService {
  /** Fetches the user's cart, creating an empty one if it doesn't exist yet. */
  static async getOrCreateCart(userId: string) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: cartInclude,
    });
  }

  /** Adds a variant to the cart, or increments quantity if already present. */
  static async addItem(userId: string, variantId: string, quantity: number) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!variant) throw AppError.notFound("Product variant not found");
    if (!variant.product.isActive) {
      throw AppError.badRequest(
        `Product "${variant.product.name}" is no longer available`,
      );
    }

    const cart = await CartService.getOrCreateCart(userId);
    const existing = cart.items.find((i) => i.variantId === variantId);
    const newQuantity = (existing?.quantity ?? 0) + quantity;

    if (variant.stockQty < newQuantity) {
      throw AppError.conflict(
        `Insufficient stock for "${variant.product.name}"`,
      );
    }

    await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      update: { quantity: newQuantity },
      create: { cartId: cart.id, variantId, quantity },
    });

    return CartService.getOrCreateCart(userId);
  }

  /** Sets the exact quantity for a cart line item. */
  static async updateItemQuantity(
    userId: string,
    variantId: string,
    quantity: number,
  ) {
    const cart = await CartService.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.variantId === variantId);
    if (!item) throw AppError.notFound("Item not found in cart");

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant || variant.stockQty < quantity) {
      throw AppError.conflict("Insufficient stock for requested quantity");
    }

    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });

    return CartService.getOrCreateCart(userId);
  }

  /** Removes a single line item from the cart. */
  static async removeItem(userId: string, variantId: string) {
    const cart = await CartService.getOrCreateCart(userId);
    const item = cart.items.find((i) => i.variantId === variantId);
    if (!item) throw AppError.notFound("Item not found in cart");

    await prisma.cartItem.delete({ where: { id: item.id } });

    return CartService.getOrCreateCart(userId);
  }

  /** Clears all items from the user's cart. */
  static async clearCart(userId: string) {
    const cart = await CartService.getOrCreateCart(userId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return CartService.getOrCreateCart(userId);
  }
}
