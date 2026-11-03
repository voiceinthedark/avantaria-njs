import "server-only";
import { Prisma, OrderStatus, PaymentStatus } from "@store/db";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { CreateOrderInput, ListOrdersInput } from "@/lib/validators/order.schema";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type OrderLine = { variantId: string; quantity: number };

export type OrderStatusUpdate = {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
};

/** Allowed order status transitions. Final states have no way out. */
const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
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
    const orderItemsData: { variantId: string; quantity: number; price: number }[] = [];

    for (const item of items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });

      if (!variant) {
        throw AppError.notFound(`Product variant ${item.variantId} not found`);
      }
      if (!variant.product.isActive) {
        throw AppError.badRequest(`Product "${variant.product.name}" is no longer available`);
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

  /** Admin/Staff: paginated, filterable list of all orders. */
  static async getAllOrders(query: ListOrdersInput) {
    const { page, limit, status, paymentStatus, from, to, search } = query;

    const createdAt: Prisma.DateTimeFilter = {};
    if (from) createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) {
      // `to` is an inclusive day, so cut off at the start of the next one.
      const end = new Date(`${to}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + 1);
      createdAt.lt = end;
    }

    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(from || to ? { createdAt } : {}),
      ...(search
        ? {
          OR: [
            ...(UUID_PATTERN.test(search) ? [{ id: search }] : []),
            { user: { email: { contains: search, mode: "insensitive" as const } } },
            { user: { firstName: { contains: search, mode: "insensitive" as const } } },
            { user: { lastName: { contains: search, mode: "insensitive" as const } } },
          ],
        }
        : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          ...orderInclude,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  static async getOrderById(id: string, userId: string, isAdminOrStaff: boolean) {
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

  // TODO: Implement refund logic (payment gateway side)
  /**
   * Updates order/payment status. Status changes must follow
   * ORDER_TRANSITIONS; cancelling an order restores stock.
   * A cancelled order cannot be marked as paid.
   */
  static async updateOrderStatus(id: string, data: OrderStatusUpdate) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) throw AppError.notFound("Order not found");

      const newStatus = data.status;
      const isChangingStatus = newStatus !== undefined && newStatus !== order.status;

      // Validate everything BEFORE touching stock.
      if (isChangingStatus && !ORDER_TRANSITIONS[order.status].includes(newStatus)) {
        const isFinal = ORDER_TRANSITIONS[order.status].length === 0;
        throw isFinal
          ? AppError.conflict(
            `Cannot change the status of an order that is already ${order.status.toLowerCase()}`,
          )
          : AppError.badRequest(`Invalid status transition from ${order.status} to ${newStatus}`);
      }

      const finalStatus = newStatus ?? order.status;
      if (finalStatus === "CANCELLED" && data.paymentStatus === "COMPLETED") {
        throw AppError.conflict("A cancelled order cannot be marked as paid");
      }

      if (isChangingStatus && newStatus === "CANCELLED") {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQty: { increment: item.quantity } },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: { status: data.status, paymentStatus: data.paymentStatus },
      });
    });
  }
}
