import "server-only";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  CreateAddressInput,
  UpdateAddressInput,
} from "@/lib/validators/address.schema";

export class AddressService {
  /** Lists the user's addresses, default first. */
  static async getAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { fullName: "asc" }],
    });
  }

  /** Returns an address owned by the user. Others' addresses look missing. */
  static async getAddressById(id: string, userId: string) {
    const address = await prisma.address.findUnique({ where: { id } });
    if (!address || address.userId !== userId) {
      throw AppError.notFound("Address not found");
    }
    return address;
  }

  /** Creates an address. The first one is always the default. */
  static async createAddress(userId: string, data: CreateAddressInput) {
    return prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId } });
      const isDefault = count === 0 || data.isDefault === true;

      if (isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({ data: { ...data, userId, isDefault } });
    });
  }

  /** Updates an address. Setting isDefault unsets the previous default. */
  static async updateAddress(
    id: string,
    userId: string,
    data: UpdateAddressInput,
  ) {
    const current = await AddressService.getAddressById(id, userId);

    if (data.isDefault === false && current.isDefault) {
      throw AppError.badRequest(
        "Set another address as default instead of unsetting this one",
      );
    }

    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
      }
      return tx.address.update({ where: { id }, data });
    });
  }

  /**
   * Deletes an address. Refused if any order uses it, because orders
   * cascade-delete with their address. If the default is deleted, the
   * oldest remaining address becomes the default.
   */
  static async deleteAddress(id: string, userId: string) {
    const address = await AddressService.getAddressById(id, userId);

    const used = await prisma.order.findFirst({
      where: { addressId: id },
      select: { id: true },
    });
    if (used) {
      throw AppError.conflict("Cannot delete an address used by an order");
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      if (address.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId },
          select: { id: true },
        });
        if (next) {
          await tx.address.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });
  }
}
