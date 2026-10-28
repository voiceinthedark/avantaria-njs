import "server-only";
import { z } from "zod";
import { AppError } from "./errors";

/**
 * Validates all required environment variables at process startup.
 * If any are missing or malformed, the app fails fast with a clear
 * error instead of crashing unpredictably later at runtime.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),

  // Supabase Storage (image uploads) — replaces Cloudinary, which is
  // unavailable in some regions.
  SUPABASE_URL: z.url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default("product-images"),

  // Temporary shared secret used to bootstrap the very first ADMIN account
  // via POST /api/auth/bootstrap-admin. The route self-disables once any
  // ADMIN user already exists, so this can be removed after initial setup.
  ADMIN_BOOTSTRAP_KEY: z
    .string()
    .min(16, "ADMIN_BOOTSTRAP_KEY must be at least 16 characters long")
    .optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("\u274c Invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  throw AppError.notFound(
    "Invalid environment variables. See server logs for details.",
  );
}

export const env = parsed.data;
