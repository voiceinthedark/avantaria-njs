import "server-only";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { StorageService } from "@/lib/storage";
import type {
  AddProductImagesInput,
  CreateProductInput,
  CreateProductVariantInput,
  UpdateProductInput,
  UpdateProductVariantInput,
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
  static async getProducts(query: ListProductsQuery, options: { includeInactive?: boolean } = {}) {
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

    const images = await prisma.productImage.findMany({
      where: { productId: id },
      select: { url: true },
    });

    await prisma.product.delete({ where: { id } });

    // DB first, files second: a failed cleanup only leaves an orphan file.
    await ProductService.cleanupImageFiles(images.map((i) => i.url));
    return true;
  }

  /**
   * Deletes the storage files behind the given URLs, skipping any URL
   * that another ProductImage row still references.
   */
  private static async cleanupImageFiles(urls: string[]) {
    if (urls.length === 0) return;
    const stillUsed = await prisma.productImage.findMany({
      where: { url: { in: urls } },
      select: { url: true },
    });
    const keep = new Set(stillUsed.map((i) => i.url));
    await StorageService.deleteByUrls(urls.filter((u) => !keep.has(u)));
  }

  /** Attaches already-uploaded images (see /api/admin/uploads) to a product. */
  static async addImages(productId: string, data: AddProductImagesInput) {
    await ProductService.getProductById(productId);

    const foreign = data.images.find((i) => StorageService.pathFromPublicUrl(i.url) === null);
    if (foreign) {
      throw AppError.badRequest("Images must be uploaded through the upload endpoint first");
    }

    await prisma.productImage.createMany({
      data: data.images.map((i) => ({ ...i, productId })),
    });

    return prisma.productImage.findMany({ where: { productId } });
  }

  /** Removes an image from a product and deletes its file from storage. */
  static async removeImage(productId: string, imageId: string) {
    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.productId !== productId) {
      throw AppError.notFound("Image not found");
    }

    await prisma.productImage.delete({ where: { id: imageId } });
    await ProductService.cleanupImageFiles([image.url]);
  }

  /** Returns a variant only if it belongs to the given product. */
  private static async getVariantOfProduct(productId: string, variantId: string) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant || variant.productId !== productId) {
      throw AppError.notFound("Variant not found");
    }
    return variant;
  }

  /** Throws 409 if the SKU or the size/color combination is already taken. */
  private static async assertVariantUnique(
    productId: string,
    data: { sku?: string; size?: string; color?: string },
    excludeVariantId?: string,
  ) {
    const notSelf = excludeVariantId ? { NOT: { id: excludeVariantId } } : {};

    if (data.sku) {
      const skuTaken = await prisma.productVariant.findFirst({
        where: { sku: data.sku, ...notSelf },
        select: { id: true },
      });
      if (skuTaken) throw AppError.conflict("SKU already in use");
    }

    if (data.size && data.color) {
      const combo = await prisma.productVariant.findFirst({
        where: { productId, size: data.size, color: data.color, ...notSelf },
        select: { id: true },
      });
      if (combo) {
        throw AppError.conflict("This product already has a variant with that size and color");
      }
    }
  }

  static async createVariant(productId: string, data: CreateProductVariantInput) {
    await ProductService.getProductById(productId);
    await ProductService.assertVariantUnique(productId, data);

    return prisma.productVariant.create({ data: { ...data, productId } });
  }

  static async updateVariant(
    productId: string,
    variantId: string,
    data: UpdateProductVariantInput,
  ) {
    const current = await ProductService.getVariantOfProduct(productId, variantId);

    // Size and color are unique together, so check the merged result.
    await ProductService.assertVariantUnique(
      productId,
      {
        sku: data.sku,
        size: data.size ?? current.size,
        color: data.color ?? current.color,
      },
      variantId,
    );

    return prisma.productVariant.update({ where: { id: variantId }, data });
  }

  /**
   * Deletes a variant. Refused if it was ever ordered (order items cascade
   * with their variant, which would erase order history) or if it is the
   * product's last variant.
   */
  static async deleteVariant(productId: string, variantId: string) {
    await ProductService.getVariantOfProduct(productId, variantId);

    const ordered = await prisma.orderItem.findFirst({
      where: { variantId },
      select: { id: true },
    });
    if (ordered) {
      throw AppError.conflict(
        "Cannot delete a variant that appears in orders. Set its stock to 0 instead",
      );
    }

    const siblings = await prisma.productVariant.count({ where: { productId } });
    if (siblings <= 1) {
      throw AppError.conflict("A product must keep at least one variant");
    }

    await prisma.productVariant.delete({ where: { id: variantId } });
  }
}
