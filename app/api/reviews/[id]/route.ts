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
  const { id, ...body } = updateReviewSchema.parse({
    ...(await req.json()),
    ...(await params),
  });
  return Response.json(await ReviewService.updateReview(id, userId, body));
});

/** Author or Admin/Staff: delete a review. */
export const DELETE = handleRoute<Ctx>(async (_req, { params }) => {
  const session = await requireUser();
  const { id } = deleteReviewSchema.parse(await params);
  await ReviewService.deleteReview(id, session.userId, isAdminOrStaff(session));
  return new Response(null, { status: 204 });
});
