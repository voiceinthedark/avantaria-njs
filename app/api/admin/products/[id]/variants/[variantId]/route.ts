import { handleRoute } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/guards";
import { ProductService } from "@/lib/services/product.service";
import {
  getProductVariantParamsSchema,
  updateProductVariantSchema,
} from "@/lib/validators/product.schema";

type Ctx = { params: Promise<{ id: string; variantId: string }> };

/** Admin: update a variant (price delta, stock, SKU, size, color). */
export const PATCH = handleRoute<Ctx>(async (req, { params }) => {
  await requireAdmin();
  const { id, variantId } = getProductVariantParamsSchema.parse(await params);
  const data = updateProductVariantSchema.parse(await req.json());
  return Response.json(await ProductService.updateVariant(id, variantId, data));
});

/** Admin: delete a variant that was never ordered. */
export const DELETE = handleRoute<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  const { id, variantId } = getProductVariantParamsSchema.parse(await params);
  await ProductService.deleteVariant(id, variantId);
  return new Response(null, { status: 204 });
});
