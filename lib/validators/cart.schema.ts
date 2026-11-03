// filepath: lib/validators/cart.schema.ts

import { z } from "zod";

export const addCartItemSchema = z.object({
  variantId: z.uuid("Invalid Variant ID format"),
  quantity: z.number().int().positive("Quantity must be at least 1").default(1),
});

export const updateCartItemSchema = z.object({
  variantId: z.uuid("Invalid Variant ID format"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

export const removeCartItemSchema = z.object({
  variantId: z.uuid("Invalid Variant ID format"),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type RemoveCartItemInput = z.infer<typeof removeCartItemSchema>;
