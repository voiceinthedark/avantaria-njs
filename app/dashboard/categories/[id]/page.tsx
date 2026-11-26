import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import CategoryForm from "../category-form";
import { CategoryService } from "@/lib/services/category.service";
import DeleteCategoryForm from "./delete-category-form";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser();

  const { id } = await params;
  const category = await CategoryService.getCategoryById(id);

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
