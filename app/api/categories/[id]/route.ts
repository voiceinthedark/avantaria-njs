import { handleRoute } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/guards";
import { CategoryService } from "@/lib/services/category.service";
import {
  getCategoryByIdSchema,
  updateCategorySchema,
  deleteCategorySchema,
} from "@/lib/validators/category.schema";

type Ctx = { params: Promise<{ id: string }> };

/** Public: get a category by id. */
export const GET = handleRoute<Ctx>(async (_req, { params }) => {
  const { id } = getCategoryByIdSchema.parse(await params);
  return Response.json(await CategoryService.getCategoryById(id));
});

/** Admin: update a category. */
export const PATCH = handleRoute<Ctx>(async (req, { params }) => {
  await requireAdmin();
  const { id } = getCategoryByIdSchema.parse(await params);
  const data = updateCategorySchema.parse(await req.json());
  return Response.json(await CategoryService.updateCategory(id, data));
});

/** Admin: delete a category (only if it has no products). */
export const DELETE = handleRoute<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  const { id } = deleteCategorySchema.parse(await params);
  await CategoryService.deleteCategory(id);
  return new Response(null, { status: 204 });
});
