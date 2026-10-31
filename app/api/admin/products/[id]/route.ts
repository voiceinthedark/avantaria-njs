import { handleRoute } from "@/lib/errors";
import { requireAdmin, requireStaff } from "@/lib/auth/guards";
import { ProductService } from "@/lib/services/product.service";
import {
  getProductByIdSchema,
  updateProductSchema,
} from "@/lib/validators/product.schema";

type Ctx = { params: Promise<{ id: string }> };

/** Admin/Staff: product by id (includes inactive). */
export const GET = handleRoute<Ctx>(async (_req, { params }) => {
  await requireStaff();
  const { id } = getProductByIdSchema.parse(await params);
  return Response.json(await ProductService.getProductById(id));
});

/** Admin: update a product. */
export const PATCH = handleRoute<Ctx>(async (req, { params }) => {
  await requireAdmin();
  const { id } = getProductByIdSchema.parse(await params);
  const data = updateProductSchema.parse(await req.json());
  return Response.json(await ProductService.updateProduct(id, data));
});

/** Admin: delete a product, or deactivate it if it has been ordered. */
export const DELETE = handleRoute<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  const { id } = getProductByIdSchema.parse(await params);
  const deleted = await ProductService.deleteProduct(id);
  return deleted
    ? new Response(null, { status: 204 })
    : Response.json({ deactivated: true });
});
