// filepath: lib/validators/product.schema.ts

import { z } from "zod";

const variantSchema = z.object({
  sku: z.string().min(3, "SKU must be at least 3 characters"),
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  stockQty: z.int().min(0, "Stock cannot be negative"),
  priceDelta: z.number().default(0),
});

export const createProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lower-case and hyphenated"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  basePrice: z.number().positive("Base price must be greater than 0"),
  categoryId: z.uuid("Invalid Category ID format"),
  isFeatured: z.boolean().optional().default(false),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
  images: z.array(z.url()).optional().default([]),
});

export const updateProductVariantSchema = variantSchema
  .partial()
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "Nothing to update" });

export const createProductVariantSchema = variantSchema;

// Body only: the id comes from the route params (see getProductByIdSchema).
export const updateProductSchema = z
  .object({
    name: z.string().min(2).optional(),
    slug: z
      .string()
      .min(2)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lower-case and hyphenated")
      .optional(),
    description: z.string().min(10).optional(),
    basePrice: z.number().positive().optional(),
    categoryId: z.uuid().optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Nothing to update",
  });

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().min(1).optional(), // category slug
  featured: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export const getProductBySlugSchema = z.object({
  slug: z.string().min(1, "Slug parameter is required"),
});

export const getProductByIdSchema = z.object({
  id: z.uuid("Invalid Product ID format"),
});

export const getProductVariantParamsSchema = z.object({
  id: z.uuid("Invalid Product ID format"),
  variantId: z.uuid("Invalid Variant ID format"),
});

export const addProductImagesSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.url("Invalid image URL"),
        altText: z.string().max(200).optional(),
      }),
    )
    .min(1, "At least one image is required")
    .max(10, "At most 10 images at once"),
});

export const getProductImageParamsSchema = z.object({
  id: z.uuid("Invalid Product ID format"),
  imageId: z.uuid("Invalid Image ID format"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type GetProductBySlugInput = z.infer<typeof getProductBySlugSchema>;
export type GetProductByIdInput = z.infer<typeof getProductByIdSchema>;
export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>;
export type AddProductImagesInput = z.infer<typeof addProductImagesSchema>;
export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>;
