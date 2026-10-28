// filepath: lib/validators/category.schema.ts

import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  slug: z
    .string()
    .min(2)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lower-case and hyphenated",
    ),
});

const updateCategorySchema = z.object({
  id: z.uuid("Invalid Category ID format"),
  name: z.string().min(2).optional(),
  slug: z
    .string()
    .min(2)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lower-case and hyphenated",
    )
    .optional(),
});

export const getCategoryByIdSchema = z.object({
  id: z.uuid("Invalid Category ID format"),
});

export const deleteCategorySchema = z.object({
  id: z.uuid("Invalid Category ID format"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type GetCategoryByIdInput = z.infer<typeof getCategoryByIdSchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
