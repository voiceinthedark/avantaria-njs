import "server-only";
import { Prisma } from "@store/db";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { CreateOrderInput } from "@/lib/validators/order.schema";

type OrderLine = { variantId: string; quantity: number };

export type OrderStatusUpdate = {
  status?: Prisma.OrderUpdateInput["status"];
  paymentStatus?: Prisma.OrderUpdateInput["paymentStatus"];
};

const orderInclude = {
  items: { include: { variant: { include: { product: true } } } },
  address: true,
} as const;

export class OrderService {
  /**
   * Core transactional logic shared by direct order creation and cart
   * checkout. Validates stock, decrements it, computes the total
   * server-side, and creates the Order + OrderItems.
   */
  private static async buildOrderInTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    addressId: string,
    items: OrderLine[],
  ) {
    const address = await tx.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId) {
      throw AppError.badRequest("Invalid delivery address");
    }

    let totalCents = 0;
    const orderItemsData: { variantId: string; quantity: number; price: number }[] =
      [];

    for (const item of items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });

      if (!variant) {
        throw AppError.notFound(`Product variant ${item.variantId} not found`);
      }
      if (!variant.product.isActive) {
        throw AppError.badRequest(
          `Product "${variant.product.name}" is no longer available`,
        );
      }

      // Atomic stock guard: only decrements if enough stock remains.
      const { count } = await tx.productVariant.updateMany({
        where: { id: variant.id, stockQty: { gte: item.quantity } },
        data: { stockQty: { decrement: item.quantity } },
      });
      if (count === 0) {
        throw AppError.conflict(
          `Insufficient stock for "${variant.product.name}" (${variant.size}/${variant.color})`,
        );
      }

      const unitCents = Math.round(
        (Number(variant.product.basePrice) + Number(variant.priceDelta)) * 100,
      );
      totalCents += unitCents * item.quantity;

      orderItemsData.push({
        variantId: variant.id,
        quantity: item.quantity,
        price: unitCents / 100,
      });
    }

    return tx.order.create({
      data: {
        userId,
        addressId,
        totalAmount: totalCents / 100,
        items: { create: orderItemsData },
      },
      include: orderInclude,
    });
  }

  /** Creates an order in one transaction; prices are computed server-side. */
  static async createOrder(userId: string, data: CreateOrderInput) {
    const { addressId, items } = data;
    return prisma.$transaction((tx) =>
      OrderService.buildOrderInTransaction(tx, userId, addressId, items),
    );
  }

  /** Places an order from the user's cart and clears it in the same transaction. */
  static async checkoutFromCart(userId: string, addressId: string) {
    return prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      if (!cart || cart.items.length === 0) {
        throw AppError.badRequest("Your cart is empty");
      }

      const order = await OrderService.buildOrderInTransaction(
        tx,
        userId,
        addressId,
        cart.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      );

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return order;
    });
  }

  static async getOrdersForUser(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  static async getAllOrders() {
    return prisma.order.findMany({
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        ...orderInclude,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getOrderById(
    id: string,
    userId: string,
    isAdminOrStaff: boolean,
  ) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) throw AppError.notFound("Order not found");
    if (!isAdminOrStaff && order.userId !== userId) {
      throw AppError.forbidden("You do not have access to this order");
    }
    return order;
  }

  /**
   * Updates order/payment status. Cancelling an order restores stock.
   * Delivered/cancelled orders can no longer change status.
   */
  static async updateOrderStatus(id: string, data: OrderStatusUpdate) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) throw AppError.notFound("Order not found");

      const isFinalized =
        order.status === "DELIVERED" || order.status === "CANCELLED";
      const isChangingStatus =
        data.status !== undefined && data.status !== order.status;

      if (isFinalized && isChangingStatus) {
        throw AppError.conflict(
          `Cannot change the status of an order that is already ${order.status.toLowerCase()}`,
        );
      }

      if (data.status === "CANCELLED" && order.status !== "CANCELLED") {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQty: { increment: item.quantity } },
          });
        }
      }

      return tx.order.update({ where: { id }, data });
    });
  }
}
