import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import CategoryForm from "../category-form";
import { CategoryService } from "@/lib/services/category.service";
import DeleteCategoryForm from "./delete-category-form";
import { getCategoryByIdSchema } from "@/lib/validators/category.schema";
import { AppError } from "@/lib/errors";
import { notFound } from "next/navigation";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser();

  const parsed = getCategoryByIdSchema.safeParse(await params);
  if (!parsed.success) notFound();

  let category;
  try {
    category = await CategoryService.getCategoryById(parsed.data.id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/categories" className="text-sm text-foreground/60">
          ← Categories
        </Link>
        <h1 className="text-xl font-semibold">{category.name}</h1>
      </div>

      <CategoryForm category={{ id: category.id, name: category.name, slug: category.slug }} />

      <DeleteCategoryForm categoryId={category.id} categoryName={category.name} />
    </div>
  );
}
