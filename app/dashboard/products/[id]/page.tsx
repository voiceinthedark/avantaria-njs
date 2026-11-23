import Link from "next/link";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors";
import { requireAdminUser } from "@/lib/auth/dal";
import { CategoryService } from "@/lib/services/category.service";
import { ProductService } from "@/lib/services/product.service";
import { getProductByIdSchema } from "@/lib/validators/product.schema";
import ProductForm from "./product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser();

  const parsed = getProductByIdSchema.safeParse(await params);
  if (!parsed.success) notFound();

  let product;
  try {
    product = await ProductService.getProductById(parsed.data.id);
  } catch (error) {
    if (error instanceof AppError) notFound();
    throw error;
  }
  const categories = await CategoryService.getAllCategories();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/products" className="text-sm text-foreground/60">
          ← Products
        </Link>
        <h1 className="text-xl font-semibold">{product.name}</h1>
      </div>

      <ProductForm
        key={product.updatedAt.toISOString()}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          basePrice: product.basePrice.toString(),
          categoryId: product.categoryId,
          isFeatured: product.isFeatured,
          isActive: product.isActive,
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
