import Link from "next/link";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors";
import { requireAdminUser } from "@/lib/auth/dal";
import { CategoryService } from "@/lib/services/category.service";
import { ProductService } from "@/lib/services/product.service";
import { getProductByIdSchema } from "@/lib/validators/product.schema";
import DeleteProductForm from "./delete-product-form";
import ImageForm from "./image-form";
import ImageItem from "./image-item";
import ProductForm from "./product-form";
import VariantForm from "./variant-form";
import VariantRow from "./variant-row";

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

      <section className="space-y-4">
        <h2 className="font-medium">Variants</h2>

        {product.variants.length === 0 ? (
          <p className="text-sm text-foreground/60">No variants yet.</p>
        ) : (
          <ul className="divide-y divide-foreground/10 rounded-xl border border-foreground/10">
            {product.variants.map((variant) => (
              <VariantRow
                key={variant.id}
                variant={{
                  id: variant.id,
                  productId: variant.productId,
                  sku: variant.sku,
                  size: variant.size,
                  color: variant.color,
                  stockQty: variant.stockQty,
                  priceDelta: variant.priceDelta.toString(),
                }}
              />
            ))}
          </ul>
        )}

        <div className="space-y-3 rounded-xl border border-foreground/10 p-4">
          <h3 className="text-sm font-medium">Add a variant</h3>
          <VariantForm productId={product.id} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-medium">Images</h2>

        {product.images.length === 0 ? (
          <p className="text-sm text-foreground/60">No images yet.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {product.images.map((image) => (
              <ImageItem
                key={image.id}
                productId={product.id}
                image={{ id: image.id, url: image.url, altText: image.altText }}
              />
            ))}
          </ul>
        )}

        <div className="space-y-3 rounded-xl border border-foreground/10 p-4">
          <h3 className="text-sm font-medium">Add images</h3>
          <ImageForm productId={product.id} />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-red-600/30 p-4">
        <h2 className="font-medium text-red-600 dark:text-red-400">Danger zone</h2>
        <p className="text-sm text-foreground/60">
          Deleting removes the product, its variants and its images. If it appears in existing
          orders, it is deactivated instead so order history stays intact.
        </p>
        <DeleteProductForm productId={product.id} productName={product.name} />
      </section>
    </div>
  );
}
