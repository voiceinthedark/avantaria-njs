"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { requireAdminUser } from "@/lib/auth/dal";
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

/*
 * Server Actions are public POST endpoints, so every action re-checks that
 * the caller is an admin (matching the admin-only product API routes).
 */

const text = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim() : undefined;

/** Empty inputs become undefined so validation reports them as missing. */
const number = (value: FormDataEntryValue | null) =>
  typeof value === "string" && value.trim() !== "" ? Number(value) : undefined;

function issueMessage(error: ZodError) {
  const issue = error.issues[0];
  if (!issue) return "Invalid input.";
  return issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message;
}

/** Turns expected service errors into form messages; rethrows anything else. */
function fail(error: unknown): ActionState {
  if (error instanceof AppError) return { ok: false, error: error.message };
  throw error;
}

const refresh = () => revalidatePath("/dashboard", "layout");

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
