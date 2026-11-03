import "server-only";
import { prisma } from "@/lib/db";
import type { DashboardStatsQuery } from "@/lib/validators/dashboard.schema";

const toNumber = (value: { toString(): string } | null | undefined) =>
  value ? Number(value.toString()) : 0;

/** UTC calendar day as YYYY-MM-DD. */
const dayKey = (date: Date) => date.toISOString().slice(0, 10);

export class DashboardService {
  /**
   * Aggregated numbers for the admin dashboard.
   *
   * Revenue counts only orders whose payment is COMPLETED. Best sellers
   * ignore cancelled orders. All days are UTC calendar days.
   */
  static async getStats({ days, lowStockThreshold }: DashboardStatsQuery) {
    // Start of the window: `days` UTC days including today.
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (days - 1));

    const [
      totalRevenue,
      periodRevenue,
      ordersByStatus,
      customerCount,
      activeProductCount,
      lowStockWhere,
      lowStockCount,
      recentOrders,
      periodOrders,
      bestSellerGroups,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { paymentStatus: "COMPLETED" },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: "COMPLETED", createdAt: { gte: since } },
        _sum: { totalAmount: true },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.productVariant.findMany({
        where: { stockQty: { lte: lowStockThreshold }, product: { isActive: true } },
        select: {
          id: true,
          sku: true,
          size: true,
          color: true,
          stockQty: true,
          product: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { stockQty: "asc" },
        take: 10,
      }),
      prisma.productVariant.count({
        where: { stockQty: { lte: lowStockThreshold }, product: { isActive: true } },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          createdAt: true,
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, totalAmount: true, status: true, paymentStatus: true },
      }),
      prisma.orderItem.groupBy({
        by: ["variantId"],
        where: { order: { status: { not: "CANCELLED" }, createdAt: { gte: since } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    // Orders per status, with zeros for statuses that have no orders.
    const statusCounts: Record<string, number> = {
      PENDING: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const row of ordersByStatus) statusCounts[row.status] = row._count._all;

    // One entry per day, including days with no sales, so charts have no gaps.
    const salesByDay = new Map<string, { orders: number; revenue: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setUTCDate(since.getUTCDate() + i);
      salesByDay.set(dayKey(d), { orders: 0, revenue: 0 });
    }
    for (const order of periodOrders) {
      const bucket = salesByDay.get(dayKey(order.createdAt));
      if (!bucket) continue;
      if (order.status !== "CANCELLED") bucket.orders += 1;
      if (order.paymentStatus === "COMPLETED") bucket.revenue += toNumber(order.totalAmount);
    }

    // Best sellers: attach variant/product details to the grouped totals.
    const variantIds = bestSellerGroups.map((g) => g.variantId);
    const variants = variantIds.length
      ? await prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: {
            id: true,
            sku: true,
            size: true,
            color: true,
            product: { select: { id: true, name: true, slug: true } },
          },
        })
      : [];
    const variantById = new Map(variants.map((v) => [v.id, v]));

    return {
      period: { days, since: since.toISOString() },
      revenue: {
        total: toNumber(totalRevenue._sum.totalAmount),
        period: toNumber(periodRevenue._sum.totalAmount),
      },
      orders: {
        total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
        byStatus: statusCounts,
      },
      customers: customerCount,
      activeProducts: activeProductCount,
      lowStock: {
        threshold: lowStockThreshold,
        count: lowStockCount,
        items: lowStockWhere,
      },
      recentOrders: recentOrders.map((o) => ({ ...o, totalAmount: toNumber(o.totalAmount) })),
      salesByDay: [...salesByDay.entries()].map(([date, v]) => ({ date, ...v })),
      bestSellers: bestSellerGroups.flatMap((g) => {
        const variant = variantById.get(g.variantId);
        return variant ? [{ variant, unitsSold: g._sum.quantity ?? 0 }] : [];
      }),
    };
  }
}
