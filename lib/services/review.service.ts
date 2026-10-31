import "server-only";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  CreateReviewInput,
  UpdateReviewInput,
} from "@/lib/validators/review.schema";

export class ReviewService {
  /**
   * Creates a review. One review per user per variant, and only for
   * variants from one of the user's delivered orders.
   */
  static async createReview(userId: string, data: CreateReviewInput) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: data.variantId },
    });
    if (!variant) throw AppError.notFound("Product variant not found");

    const existing = await prisma.review.findFirst({
      where: { userId, variantId: data.variantId },
    });
    if (existing) {
      throw AppError.conflict("You have already reviewed this product");
    }

    const verifiedPurchase = await prisma.orderItem.findFirst({
      where: {
        variantId: data.variantId,
        order: { userId, status: "DELIVERED" },
      },
    });
    if (!verifiedPurchase) {
      throw AppError.forbidden(
        "You can only review products from a delivered order",
      );
    }

    return prisma.review.create({
      data: {
        userId,
        variantId: data.variantId,
        rating: data.rating,
        comment: data.comment,
      },
    });
  }

  /** Lists reviews for a variant, most recent first. */
  static async getReviewsForVariant(variantId: string) {
    return prisma.review.findMany({
      where: { variantId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Lists the user's own reviews. */
  static async getReviewsForUser(userId: string) {
    return prisma.review.findMany({
      where: { userId },
      include: { variant: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Only the author may update a review. */
  static async updateReview(
    id: string,
    userId: string,
    data: UpdateReviewInput,
  ) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw AppError.notFound("Review not found");
    if (review.userId !== userId) {
      throw AppError.forbidden("You can only edit your own reviews");
    }
    return prisma.review.update({ where: { id }, data });
  }

  /** The author or Admin/Staff may delete a review. */
  static async deleteReview(
    id: string,
    userId: string,
    isAdminOrStaff: boolean,
  ) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw AppError.notFound("Review not found");
    if (!isAdminOrStaff && review.userId !== userId) {
      throw AppError.forbidden("You can only delete your own reviews");
    }
    await prisma.review.delete({ where: { id } });
  }
}
