// filepath: lib/validators/auth.schema.ts

import { z } from "zod";

const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const passwordRegexSchema = z
  .string()
  .regex(
    passwordRegex,
    "Password must be at least 8 characters long, contain at least one uppercase letter and one number",
  );

export const registerSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .and(passwordRegexSchema),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

// Temporary: used only by POST /api/auth/bootstrap-admin to create the
// very first ADMIN account. The secret is sent via the
// `x-bootstrap-key` header (validated in the controller), not the body.
export const bootstrapAdminSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .and(passwordRegexSchema),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BootstrapAdminInput = z.infer<typeof bootstrapAdminSchema>;
