// filepath: lib/validators/order.schema.ts

import { z } from "zod";

enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export const createOrderSchema = z.object({
  addressId: z.uuid("Invalid Address ID format"),
  items: z
    .array(
      z.object({
        variantId: z.uuid("Invalid Variant ID format"),
        quantity: z.number().int().positive("Quantity must be at least 1"),
      }),
    )
    .min(1, "Order must contain at least one item"),
});

export const checkoutSchema = z.object({
  addressId: z.uuid("Invalid Address ID format"),
});

export const getOrderByIdSchema = z.object({
  id: z.uuid("Invalid Order ID format"),
});

export const updateOrderStatusSchema = z
  .object({
    id: z.uuid("Invalid Order ID format"),
    status: z.enum(OrderStatus).optional(),
    paymentStatus: z.enum(PaymentStatus).optional(),
  })
  .refine(
    (v) => v.status || v.paymentStatus,
    "At least one of status or paymentStatus must be provided",
  );

/**
 * Admin order list query (parsed from the URL query string, hence the
 * coercion). `from`/`to` are inclusive calendar days (YYYY-MM-DD, UTC).
 * `search` matches customer email/name or an exact order ID.
 */
export const listOrdersSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(OrderStatus).optional(),
    paymentStatus: z.enum(PaymentStatus).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    search: z.string().trim().min(1).max(100).optional(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: "`from` must not be after `to`",
    path: ["from"],
  });

export const listOrdersForUserSchema = z.object({
  page: z.number().int().positive("Page must be a positive integer").optional(),
  limit: z.number().int().positive("Limit must be a positive integer").optional(),
  status: z.enum(OrderStatus).optional(),
  paymentStatus: z.enum(PaymentStatus).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type GetOrderByIdInput = z.infer<typeof getOrderByIdSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ListOrdersInput = z.infer<typeof listOrdersSchema>;
export type ListOrdersForUserInput = z.infer<typeof listOrdersForUserSchema>;
