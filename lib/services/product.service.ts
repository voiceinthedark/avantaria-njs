import "server-only";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  CreateProductInput,
  UpdateProductInput,
  ListProductsQuery,
} from "@/lib/validators/product.schema";

const productInclude = {
  category: true,
  variants: true,
  images: true,
} as const;

export class ProductService {
  /**
   * Paginated product list with average rating + review count.
   * Public callers only see active products.
   */
  static async getProducts(
    query: ListProductsQuery,
    options: { includeInactive?: boolean } = {},
  ) {
    const { page, limit, category, featured } = query;

    const where = {
      ...(options.includeInactive ? {} : { isActive: true }),
      ...(category ? { category: { slug: category } } : {}),
      ...(featured !== undefined ? { isFeatured: featured } : {}),
    };

    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const variantToProduct = new Map<string, string>();
    for (const product of products) {
      for (const variant of product.variants) {
        variantToProduct.set(variant.id, product.id);
      }
    }

    // One grouped query (per variant) instead of loading every review row.
    const grouped = variantToProduct.size
      ? await prisma.review.groupBy({
          by: ["variantId"],
          where: { variantId: { in: [...variantToProduct.keys()] } },
          _avg: { rating: true },
          _count: { rating: true },
        })
      : [];

    const statsByProduct = new Map<string, { sum: number; count: number }>();
    for (const row of grouped) {
      const productId = variantToProduct.get(row.variantId);
      if (!productId) continue;
      const stats = statsByProduct.get(productId) ?? { sum: 0, count: 0 };
      stats.sum += (row._avg.rating ?? 0) * row._count.rating;
      stats.count += row._count.rating;
      statsByProduct.set(productId, stats);
    }

    return {
      items: products.map((product) => {
        const stats = statsByProduct.get(product.id);
        return {
          ...product,
          averageRating: stats ? stats.sum / stats.count : null,
          reviewCount: stats?.count ?? 0,
        };
      }),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Public: product by slug with rating stats. Hides inactive products. */
  static async getSingleProduct(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });
    if (!product || !product.isActive) {
      throw AppError.notFound("Product not found");
    }

    const ratingStats = await prisma.review.aggregate({
      where: { variantId: { in: product.variants.map((v) => v.id) } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      ...product,
      averageRating: ratingStats._avg.rating ?? null,
      reviewCount: ratingStats._count.rating,
    };
  }

  /** Admin: product by id (includes inactive). */
  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) throw AppError.notFound("Product not found");
    return product;
  }

  private static async assertCategoryExists(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) throw AppError.badRequest("Category does not exist");
  }

  static async createProduct(data: CreateProductInput) {
    const { variants, images, ...productData } = data;

    await ProductService.assertCategoryExists(productData.categoryId);

    const slugTaken = await prisma.product.findUnique({
      where: { slug: productData.slug },
      select: { id: true },
    });
    if (slugTaken) throw AppError.conflict("Product slug already in use");

    return prisma.product.create({
      data: {
        ...productData,
        variants: { create: variants },
        images: { create: images.map((url) => ({ url })) },
      },
      include: productInclude,
    });
  }

  static async updateProduct(id: string, data: UpdateProductInput) {
    await ProductService.getProductById(id);

    if (data.categoryId) {
      await ProductService.assertCategoryExists(data.categoryId);
    }
    if (data.slug) {
      const clash = await prisma.product.findUnique({
        where: { slug: data.slug },
        select: { id: true },
      });
      if (clash && clash.id !== id) {
        throw AppError.conflict("Product slug already in use");
      }
    }

    return prisma.product.update({
      where: { id },
      data,
      include: productInclude,
    });
  }

  /**
   * Hard-deletes a product that was never ordered. Products that appear in
   * existing orders are deactivated instead, to preserve order history.
   * Returns true if deleted, false if only deactivated.
   */
  static async deleteProduct(id: string) {
    await ProductService.getProductById(id);

    const ordered = await prisma.orderItem.findFirst({
      where: { variant: { productId: id } },
      select: { id: true },
    });

    if (ordered) {
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      return false;
    }

    await prisma.product.delete({ where: { id } });
    return true;
  }
}
