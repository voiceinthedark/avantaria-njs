import { handleRoute } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/guards";
import { ProductService } from "@/lib/services/product.service";
import { getProductImageParamsSchema } from "@/lib/validators/product.schema";

type Ctx = { params: Promise<{ id: string; imageId: string }> };

/** Admin: remove an image from a product and delete its file. */
export const DELETE = handleRoute<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  const { id, imageId } = getProductImageParamsSchema.parse(await params);
  await ProductService.removeImage(id, imageId);
  return new Response(null, { status: 204 });
});
