import { handleRoute } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/guards";
import { ProductService } from "@/lib/services/product.service";
import {
  createProductVariantSchema,
  getProductByIdSchema,
} from "@/lib/validators/product.schema";

type Ctx = { params: Promise<{ id: string }> };

/** Admin: add a variant to a product. */
export const POST = handleRoute<Ctx>(async (req, { params }) => {
  await requireAdmin();
  const { id } = getProductByIdSchema.parse(await params);
  const data = createProductVariantSchema.parse(await req.json());
  return Response.json(await ProductService.createVariant(id, data), {
    status: 201,
  });
});
