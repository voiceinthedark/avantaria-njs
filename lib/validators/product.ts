// filepath: lib/validators/product.ts

import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, { message: "Product name is required" }),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug must be lowercase and can contain hyphens",
    }),
  description: z
    .string()
    .min(1, { message: "Product description is required" }),
  basePrice: z
    .number()
    .min(0, { message: "Base price must be a positive number" }),
  categoryId: z.uuid({ message: "Invalid category Id" }),
  isFeatured: z.boolean().optional().default(false),
});

export const getProductBySlugSchema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug must be lowercase and can contain hyphens",
    }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
