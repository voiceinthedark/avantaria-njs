// categories/page.tsx

import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { CategoryService } from "@/lib/services/category.service";
import { buttonClass } from "../_components/form-styles";

export default async function CategoriesPage() {
  await requireAdminUser();

  const categories = await CategoryService.getAllCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Categories</h1>
        <Link href="/dashboard/categories/add" className={buttonClass}>
          New category
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-xl border border-foreground/10 p-6 text-center text-sm text-foreground/60">
          No categories yet.
        </p>
      ) : (
        <ul className="divide-y divide-foreground/10 rounded-xl border border-foreground/10">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-4 p-4">
              <span>{category.name}</span>

              <Link
                href={`/dashboard/categories/${category.id}`}
                className="text-sm text-foreground/60 hover:underline"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
