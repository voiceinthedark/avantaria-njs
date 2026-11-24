"use server";

import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/auth/dal";
import { ProductService } from "@/lib/services/product.service";
import { createProductSchema } from "@/lib/validators/product.schema";
import type { ActionState } from "../_components/form-message";
import { text, number, issueMessage, fail, refresh } from "../_lib/action-helpers";

export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminUser();

  const data = createProductSchema.safeParse({
    name: text(formData.get("name")),
    slug: text(formData.get("slug")),
    description: text(formData.get("description")),
    basePrice: number(formData.get("basePrice")),
    categoryId: text(formData.get("categoryId")),
    isFeatured: formData.get("isFeatured") === "on",
    variants: [
      {
        sku: text(formData.get("sku")),
        size: text(formData.get("size")),
        color: text(formData.get("color")),
        stockQty: number(formData.get("stockQty")),
        priceDelta: number(formData.get("priceDelta")),
      },
    ],
  });
  if (!data.success) return { ok: false, error: issueMessage(data.error) };

  let product;
  try {
    product = await ProductService.createProduct(data.data);
  } catch (error) {
    return fail(error);
  }

  refresh();
  redirect(`/dashboard/products/${product.id}`);
}
