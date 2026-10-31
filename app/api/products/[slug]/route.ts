import { handleRoute } from "@/lib/errors";
import { ProductService } from "@/lib/services/product.service";
import { getProductBySlugSchema } from "@/lib/validators/product.schema";

type Ctx = { params: Promise<{ slug: string }> };

/** Public: single active product by slug. */
export const GET = handleRoute<Ctx>(async (_req, { params }) => {
  const { slug } = getProductBySlugSchema.parse(await params);
  return Response.json(await ProductService.getSingleProduct(slug));
});
