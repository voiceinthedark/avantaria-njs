import { handleRoute } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { ReviewService } from "@/lib/services/review.service";

/** Customer: own reviews. */
export const GET = handleRoute(async () => {
  const { userId } = await requireUser();
  return Response.json(await ReviewService.getReviewsForUser(userId));
});
