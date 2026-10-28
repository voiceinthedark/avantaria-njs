// filepath: lib/validators/cart.schema.ts

import { z } from "zod";

export const addCartItemSchema = z.object({
  body: z.object({
    variantId: z.uuid("Invalid Variant ID format"),
    quantity: z
      .number()
      .int()
      .positive("Quantity must be at least 1")
      .default(1),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    variantId: z.uuid("Invalid Variant ID format"),
  }),
  body: z.object({
    quantity: z.number().int().positive("Quantity must be at least 1"),
  }),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    variantId: z.uuid("Invalid Variant ID format"),
  }),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>["body"];
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>["body"];
export type RemoveCartItemInput = z.infer<
  typeof removeCartItemSchema
>["params"];
