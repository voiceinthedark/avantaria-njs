"use server";

import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/dal";
import { StorageService } from "@/lib/storage";
import { ProductService } from "@/lib/services/product.service";
import {
  createProductVariantSchema,
  getProductByIdSchema,
  getProductVariantParamsSchema,
  getProductImageParamsSchema,
  updateProductSchema,
  updateProductVariantSchema,
} from "@/lib/validators/product.schema";
import type { ActionState } from "../../_components/form-message";
import { text, number, issueMessage, fail, refresh } from "../../_lib/action-helpers";

/*
 * Server Actions are public POST endpoints, so every action re-checks that
 * the caller is an admin (matching the admin-only product API routes).
 */

export async function updateProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminUser();

  const id = getProductByIdSchema.safeParse({ id: formData.get("id") });
  if (!id.success) return { ok: false, error: "Invalid product." };

  const data = updateProductSchema.safeParse({
    name: text(formData.get("name")),
    slug: text(formData.get("slug")),
    description: text(formData.get("description")),
    basePrice: number(formData.get("basePrice")),
    categoryId: text(formData.get("categoryId")),
    // Unchecked checkboxes are simply absent from the form data.
    isFeatured: formData.get("isFeatured") === "on",
    isActive: formData.get("isActive") === "on",
  });
  if (!data.success) return { ok: false, error: issueMessage(data.error) };

  try {
    await ProductService.updateProduct(id.data.id, data.data);
  } catch (error) {
    return fail(error);
  }
  refresh();
  return { ok: true, message: "Product saved." };
}

function variantFields(formData: FormData) {
  return {
    sku: text(formData.get("sku")),
    size: text(formData.get("size")),
    color: text(formData.get("color")),
    stockQty: number(formData.get("stockQty")),
    priceDelta: number(formData.get("priceDelta")),
  };
}

export async function createVariantAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminUser();

  const id = getProductByIdSchema.safeParse({ id: formData.get("productId") });
  if (!id.success) return { ok: false, error: "Invalid product." };

  const data = createProductVariantSchema.safeParse(variantFields(formData));
  if (!data.success) return { ok: false, error: issueMessage(data.error) };

  try {
    await ProductService.createVariant(id.data.id, data.data);
  } catch (error) {
    return fail(error);
  }
  refresh();
  return { ok: true, message: "Variant added." };
}

export async function updateVariantAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminUser();

  const ids = getProductVariantParamsSchema.safeParse({
    id: formData.get("productId"),
    variantId: formData.get("variantId"),
  });
  if (!ids.success) return { ok: false, error: "Invalid variant." };

  const data = updateProductVariantSchema.safeParse(variantFields(formData));
  if (!data.success) return { ok: false, error: issueMessage(data.error) };

  try {
    await ProductService.updateVariant(ids.data.id, ids.data.variantId, data.data);
  } catch (error) {
    return fail(error);
  }
  refresh();
  return { ok: true, message: "Variant saved." };
}

export async function deleteVariantAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminUser();

  const ids = getProductVariantParamsSchema.safeParse({
    id: formData.get("productId"),
    variantId: formData.get("variantId"),
  });
  if (!ids.success) return { ok: false, error: "Invalid variant." };

  try {
    await ProductService.deleteVariant(ids.data.id, ids.data.variantId);
  } catch (error) {
    return fail(error);
  }
  refresh();
  return { ok: true };
}

export async function addImagesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminUser();

  const id = getProductByIdSchema.safeParse({ id: formData.get("productId") });
  if (!id.success) return { ok: false, error: "Invalid product." };

  // An empty file input still submits one zero-byte File.
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length === 0) return { ok: false, error: "Choose at least one image." };

  let uploaded: { path: string; url: string }[] = [];
  try {
    uploaded = await StorageService.uploadImages(files);
    await ProductService.addImages(id.data.id, {
      images: uploaded.map(({ url }) => ({ url })),
    });
  } catch (error) {
    // Don't leave files behind if they couldn't be attached to the product.
    await StorageService.deleteByUrls(uploaded.map((u) => u.url));
    return fail(error);
  }
  refresh();
  return { ok: true, message: files.length === 1 ? "Image added." : "Images added." };
}

export async function removeImageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminUser();

  const ids = getProductImageParamsSchema.safeParse({
    id: formData.get("productId"),
    imageId: formData.get("imageId"),
  });
  if (!ids.success) return { ok: false, error: "Invalid image." };

  try {
    await ProductService.removeImage(ids.data.id, ids.data.imageId);
  } catch (error) {
    return fail(error);
  }
  refresh();
  return { ok: true };
}

export async function deleteProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminUser();

  const id = getProductByIdSchema.safeParse({ id: formData.get("id") });
  if (!id.success) return { ok: false, error: "Invalid product." };

  let deleted: boolean;
  try {
    deleted = await ProductService.deleteProduct(id.data.id);
  } catch (error) {
    return fail(error);
  }
  refresh();

  // redirect() throws, so it stays outside the try/catch.
  if (deleted) redirect("/dashboard/products");
  return {
    ok: true,
    message: "This product appears in existing orders, so it was deactivated instead of deleted.",
  };
}
