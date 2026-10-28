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

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type GetOrderByIdInput = z.infer<typeof getOrderByIdSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
