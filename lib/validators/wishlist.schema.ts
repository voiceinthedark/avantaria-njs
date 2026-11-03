// filepath: lib/validators/wishlist.schema.ts

import { z } from "zod";

export const addWishlistItemSchema = z.object({
  variantId: z.uuid("Invalid Variant ID format"),
});

export const removeWishlistItemSchema = z.object({
  variantId: z.uuid("Invalid Variant ID format"),
});

export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>;
export type RemoveWishlistItemInput = z.infer<typeof removeWishlistItemSchema>;
