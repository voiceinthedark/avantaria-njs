// filepath: lib/validators/review.schema.ts

import { z } from "zod";

export const createReviewSchema = z.object({
  variantId: z.uuid("Invalid Variant ID format"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().max(1000, "Comment is too long").optional(),
});

export const updateReviewSchema = z.object({
  id: z.uuid("Invalid Review ID format"),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000, "Comment is too long").optional(),
});

export const deleteReviewSchema = z.object({
  id: z.uuid("Invalid Review ID format"),
});

export const getReviewsByVariantSchema = z.object({
  variantId: z.uuid("Invalid Variant ID format"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = Omit<z.infer<typeof updateReviewSchema>, "id">;
export type DeleteReviewInput = z.infer<typeof deleteReviewSchema>;
export type GetReviewsByVariantInput = z.infer<typeof getReviewsByVariantSchema>;
