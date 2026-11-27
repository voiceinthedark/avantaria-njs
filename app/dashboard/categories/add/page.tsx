import Link from "next/link";
import { requireAdminUser } from "@/lib/auth/dal";
import CategoryForm from "../category-form";

export default async function AddCategoryPage() {
  await requireAdminUser();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/categories" className="text-sm text-foreground/60">
          ← Categories
        </Link>
        <h1 className="text-xl font-semibold">Add category</h1>
      </div>

      <CategoryForm category={{ id: "", name: "", slug: "" }} />
    </div>
  );
}
