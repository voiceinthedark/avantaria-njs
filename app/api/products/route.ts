import { handleRoute } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/guards";
import { ProductService } from "@/lib/services/product.service";
import {
  createProductSchema,
  listProductsQuerySchema,
} from "@/lib/validators/product.schema";

/** Public: paginated list of active products. */
export const GET = handleRoute(async (req) => {
  const query = listProductsQuerySchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );
  return Response.json(await ProductService.getProducts(query));
});

/** Admin: create a product with variants and images. */
export const POST = handleRoute(async (req) => {
  await requireAdmin();
  const data = createProductSchema.parse(await req.json());
  const product = await ProductService.createProduct(data);
  return Response.json(product, { status: 201 });
});
