import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import { CategoryService } from "@/lib/services/category.service";
import CreateProductForm from "./create-product-form";

export default async function AddProductPage() {
  await requireAdminUser();

  const categories = await CategoryService.getAllCategories();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/products" className="text-sm text-foreground/60">
          ← Products
        </Link>
        <h1 className="text-xl font-semibold">Add product</h1>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-xl border border-foreground/10 p-6 text-center text-sm text-foreground/60">
          Create a category before adding products.
        </p>
      ) : (
        <CreateProductForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
      )}
    </div>
  );
}
