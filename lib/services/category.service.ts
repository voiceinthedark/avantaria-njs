import "server-only";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/validators/category.schema";

export class CategoryService {
  static async getAllCategories() {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  }

  static async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw AppError.notFound("Category not found");
    return category;
  }

  static async createCategory(data: CreateCategoryInput) {
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
    });
    if (existing) throw AppError.conflict("Category slug already in use");

    return prisma.category.create({ data });
  }

  static async updateCategory(id: string, data: UpdateCategoryInput) {
    await CategoryService.getCategoryById(id);

    if (data.slug) {
      const clash = await prisma.category.findUnique({
        where: { slug: data.slug },
      });
      if (clash && clash.id !== id) {
        throw AppError.conflict("Category slug already in use");
      }
    }

    return prisma.category.update({ where: { id }, data });
  }

  static async deleteCategory(id: string) {
    await CategoryService.getCategoryById(id);

    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });
    if (productCount > 0) {
      throw AppError.conflict(
        "Cannot delete a category that still has products",
      );
    }

    await prisma.category.delete({ where: { id } });
  }
}
