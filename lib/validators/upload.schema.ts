// filepath: lib/validators/upload.schema.ts

import { z } from "zod";

export const deleteImageSchema = z.object({
  path: z.string().min(1, "Image path is required"),
});

export type DeleteImageInput = z.infer<typeof deleteImageSchema>;
