// filepath: lib/validators/user.schema.ts

import { z } from "zod";
import { passwordSchema } from "./shared";

export const updateProfileSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").optional(),
    lastName: z.string().min(1, "Last name is required").optional(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
      .optional(),
  })
  .refine(
    (v) => Object.values(v).some((x) => x !== undefined),
    "At least one field must be provided",
  );

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

export const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(["CUSTOMER", "ADMIN", "STAFF"]).optional(),
});

export const getUserByIdSchema = z.object({
  id: z.uuid("Invalid User ID format"),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["CUSTOMER", "ADMIN", "STAFF"]),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ListUsersQuery = z.infer<typeof listUsersSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
