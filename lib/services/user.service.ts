import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  ChangePasswordInput,
  ListUsersQuery,
  UpdateProfileInput,
  UpdateUserRoleInput,
} from "@/lib/validators/user.schema";

const BCRYPT_ROUNDS = 12;

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  phone: true,
  createdAt: true,
} as const;

export class UserService {
  /** Self-service: update the signed-in user's profile. */
  static async updateProfile(userId: string, data: UpdateProfileInput) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: publicUserSelect,
    });
  }

  /** Self-service: change password after verifying the current one. */
  static async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.unauthorized();

    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid) throw AppError.badRequest("Current password is incorrect");

    const passwordHash = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  /** Admin: paginated user list, optionally filtered by role. */
  static async getUsers(query: ListUsersQuery) {
    const { page, limit, role } = query;
    const where = role ? { role } : {};

    const [total, items] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: publicUserSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  /** Admin: single user by id. */
  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
    if (!user) throw AppError.notFound("User not found");
    return user;
  }

  /** Admin: change a user's role. Admins cannot change their own role. */
  static async updateUserRole(
    id: string,
    actingUserId: string,
    data: UpdateUserRoleInput,
  ) {
    if (id === actingUserId) {
      throw AppError.badRequest("You cannot change your own role");
    }
    await UserService.getUserById(id);

    return prisma.user.update({
      where: { id },
      data: { role: data.role },
      select: publicUserSelect,
    });
  }

  /**
   * Admin: deletes a user. Refused for self and for users with orders
   * (order history must be preserved). Also removes the user's
   * addresses, cart and wishlist, which have no cascade in the schema.
   */
  static async deleteUser(id: string, actingUserId: string) {
    if (id === actingUserId) {
      throw AppError.badRequest("You cannot delete your own account");
    }
    await UserService.getUserById(id);

    const hasOrders = await prisma.order.findFirst({
      where: { userId: id },
      select: { id: true },
    });
    if (hasOrders) {
      throw AppError.conflict("Cannot delete a user who has placed orders");
    }

    await prisma.$transaction([
      prisma.cart.deleteMany({ where: { userId: id } }),
      prisma.wishlist.deleteMany({ where: { userId: id } }),
      prisma.address.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);
  }
}
