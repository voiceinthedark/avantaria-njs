import { handleRoute } from "@/lib/errors";
import { requireStaff } from "@/lib/auth/guards";
import { DashboardService } from "@/lib/services/dashboard.service";
import { dashboardStatsQuerySchema } from "@/lib/validators/dashboard.schema";

/** Admin/Staff: dashboard numbers (?days=30&lowStockThreshold=5). */
export const GET = handleRoute(async (req) => {
  await requireStaff();
  const query = dashboardStatsQuerySchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );
  return Response.json(await DashboardService.getStats(query));
});
