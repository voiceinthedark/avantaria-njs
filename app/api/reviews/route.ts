import { handleRoute } from "@/lib/errors";
import { requireUser } from "@/lib/auth/guards";
import { ReviewService } from "@/lib/services/review.service";
import { createReviewSchema } from "@/lib/validators/review.schema";

/** Customer: create a review for a purchased variant. */
export const POST = handleRoute(async (req) => {
  const { userId } = await requireUser();
  const { body } = createReviewSchema.parse({ body: await req.json() });
  return Response.json(await ReviewService.createReview(userId, body), {
    status: 201,
  });
});
