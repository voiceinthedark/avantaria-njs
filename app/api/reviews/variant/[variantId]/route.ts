import { handleRoute } from "@/lib/errors";
import { ReviewService } from "@/lib/services/review.service";
import { getReviewsByVariantSchema } from "@/lib/validators/review.schema";

type Ctx = { params: Promise<{ variantId: string }> };

/** Public: reviews for a variant. */
export const GET = handleRoute<Ctx>(async (_req, { params }) => {
  const { variantId } = getReviewsByVariantSchema.parse(await params);
  return Response.json(await ReviewService.getReviewsForVariant(variantId));
});
