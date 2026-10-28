// filepath: lib/validators/wishlist.schema.ts

import { z } from "zod";

export const addWishlistItemSchema = z.object({
  body: z.object({
    variantId: z.uuid("Invalid Variant ID format"),
  }),
});

export const removeWishlistItemSchema = z.object({
  params: z.object({
    variantId: z.uuid("Invalid Variant ID format"),
  }),
});

export type AddWishlistItemInput = z.infer<
  typeof addWishlistItemSchema
>["body"];
export type RemoveWishlistItemInput = z.infer<
  typeof removeWishlistItemSchema
>["params"];
