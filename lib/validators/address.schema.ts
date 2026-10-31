// filepath: lib/validators/address.schema.ts

import { z } from "zod";

const addressFields = {
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  isDefault: z.boolean().optional(),
};

export const createAddressSchema = z.object(addressFields);

export const updateAddressSchema = z
  .object(addressFields)
  .partial()
  .refine(
    (v) => Object.values(v).some((x) => x !== undefined),
    "At least one field must be provided",
  );

export const getAddressByIdSchema = z.object({
  id: z.uuid("Invalid Address ID format"),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
