// filepath: lib/validators/dashboard.schema.ts

import { z } from "zod";

export const dashboardStatsQuerySchema = z.object({
  /** Size of the sales window, in days (including today). */
  days: z.coerce.number().int().min(1).max(365).default(30),
  /** Variants with stock at or below this are reported as low stock. */
  lowStockThreshold: z.coerce.number().int().min(0).max(1000).default(5),
});

export type DashboardStatsQuery = z.infer<typeof dashboardStatsQuerySchema>;
