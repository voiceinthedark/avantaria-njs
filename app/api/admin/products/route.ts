import { handleRoute } from "@/lib/errors";
import { requireStaff } from "@/lib/auth/guards";
import { ProductService } from "@/lib/services/product.service";
import { listProductsQuerySchema } from "@/lib/validators/product.schema";

/** Admin/Staff: paginated list including inactive products. */
export const GET = handleRoute(async (req) => {
  await requireStaff();
  const query = listProductsQuerySchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );
  return Response.json(
    await ProductService.getProducts(query, { includeInactive: true }),
  );
});
