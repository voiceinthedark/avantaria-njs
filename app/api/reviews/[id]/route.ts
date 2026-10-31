import { handleRoute } from "@/lib/errors";
import { isAdminOrStaff, requireUser } from "@/lib/auth/guards";
import { ReviewService } from "@/lib/services/review.service";
import {
  deleteReviewSchema,
  updateReviewSchema,
} from "@/lib/validators/review.schema";

type Ctx = { params: Promise<{ id: string }> };

/** Author: update own review. */
export const PATCH = handleRoute<Ctx>(async (req, { params }) => {
  const { userId } = await requireUser();
  const { params: p, body } = updateReviewSchema.parse({
    params: await params,
    body: await req.json(),
  });
  return Response.json(await ReviewService.updateReview(p.id, userId, body));
});

/** Author or Admin/Staff: delete a review. */
export const DELETE = handleRoute<Ctx>(async (_req, { params }) => {
  const session = await requireUser();
  const { params: p } = deleteReviewSchema.parse({ params: await params });
  await ReviewService.deleteReview(p.id, session.userId, isAdminOrStaff(session));
  return new Response(null, { status: 204 });
});
