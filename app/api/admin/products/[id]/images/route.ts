import { handleRoute } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/guards";
import { ProductService } from "@/lib/services/product.service";
import {
  addProductImagesSchema,
  getProductByIdSchema,
} from "@/lib/validators/product.schema";

type Ctx = { params: Promise<{ id: string }> };

/** Admin: attach uploaded images (by public URL) to a product. */
export const POST = handleRoute<Ctx>(async (req, { params }) => {
  await requireAdmin();
  const { id } = getProductByIdSchema.parse(await params);
  const data = addProductImagesSchema.parse(await req.json());
  return Response.json(await ProductService.addImages(id, data), {
    status: 201,
  });
});
