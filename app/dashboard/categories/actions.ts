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
import { text, issueMessage, fail } from "../_lib/action-helpers";

export async function CreateCategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  requireAdminUser();

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
}

export async function UpdateCategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  requireAdminUser();

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
}

export async function DeleteCategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  requireAdminUser();

  const id = deleteCategorySchema.safeParse({ id: formData.get("id") });
  if (!id.success) return { ok: false, error: "Invalid category." };

  try {
    await CategoryService.deleteCategory(id.data.id);
  } catch (error) {
    return fail(error);
  }
}
