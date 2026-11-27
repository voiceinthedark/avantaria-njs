"use server";

import { CategoryService } from "@/lib/services/category.service";
import { requireAdminUser } from "@/lib/auth/dal";
import {
  getCategoryByIdSchema,
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
} from "@/lib/validators/category.schema";
import type { ActionState } from "../_components/form-message";
import { text, issueMessage, fail, refresh } from "../_lib/action-helpers";
import { redirect } from "next/navigation";

export async function createCategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminUser();

  const data = createCategorySchema.safeParse({
    name: text(formData.get("name")),
    slug: text(formData.get("slug")),
  });

  if (!data.success) return { ok: false, error: issueMessage(data.error) };

  try {
    await CategoryService.createCategory(data.data);
  } catch (error) {
    return fail(error);
  }
  refresh();
  redirect("/dashboard/categories");
}

export async function updateCategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminUser();

  const id = getCategoryByIdSchema.safeParse({ id: formData.get("id") });
  if (!id.success) return { ok: false, error: "Invalid category." };

  const data = updateCategorySchema.safeParse({
    name: text(formData.get("name")),
    slug: text(formData.get("slug")),
  });

  if (!data.success) return { ok: false, error: issueMessage(data.error) };

  try {
    await CategoryService.updateCategory(id.data.id, data.data);
  } catch (error) {
    return fail(error);
  }
  refresh();
  return { ok: true, message: "Category saved." };
}

export async function deleteCategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminUser();

  const id = deleteCategorySchema.safeParse({ id: formData.get("id") });
  if (!id.success) return { ok: false, error: "Invalid category." };

  try {
    await CategoryService.deleteCategory(id.data.id);
  } catch (error) {
    return fail(error);
  }
  refresh();
  redirect("/dashboard/categories");
}
