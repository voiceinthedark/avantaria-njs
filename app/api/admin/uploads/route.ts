import { handleRoute, AppError } from "@/lib/errors";
import { requireStaff } from "@/lib/auth/guards";
import { StorageService } from "@/lib/storage";
import { deleteImageSchema } from "@/lib/validators/upload.schema";

/**
 * Admin/Staff: upload up to 5 product images.
 * Send multipart/form-data with one or more `images` fields.
 * Returns the public URLs plus the storage paths (needed to delete).
 */
export const POST = handleRoute(async (req) => {
  await requireStaff();

  const form = await req.formData().catch(() => {
    throw AppError.badRequest("Expected multipart/form-data");
  });
  const files = form.getAll("images").filter((v): v is File => v instanceof File);

  const uploaded = await StorageService.uploadImages(files);
  return Response.json(
    { urls: uploaded.map((u) => u.url), images: uploaded },
    { status: 201 },
  );
});

/** Admin/Staff: delete an uploaded image by its storage path. */
export const DELETE = handleRoute(async (req) => {
  await requireStaff();
  const { path } = deleteImageSchema.parse(await req.json());
  await StorageService.deleteImage(path);
  return new Response(null, { status: 204 });
});
