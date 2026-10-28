import { handleRoute } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/guards";
import { CategoryService } from "@/lib/services/category.service";
import { createCategorySchema } from "@/lib/validators/category.schema";

/** Public: list all categories. */
export const GET = handleRoute(async () => {
  const categories = await CategoryService.getAllCategories();
  return Response.json(categories);
});

/** Admin: create a category. */
export const POST = handleRoute(async (req) => {
  await requireAdmin();
  const data = createCategorySchema.parse(await req.json());
  const category = await CategoryService.createCategory(data);
  return Response.json(category, { status: 201 });
});
