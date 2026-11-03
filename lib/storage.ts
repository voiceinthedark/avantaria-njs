import "server-only";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGES_PER_UPLOAD = 5;

/**
 * Server-side Supabase client using the service role key. It bypasses
 * Row Level Security, so it must only be used in server code after an
 * authorization check. Never expose the key to the browser.
 */
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type ImageType = { mime: string; ext: string };

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((b, i) => bytes[offset + i] === b);

/**
 * Detects the real image type from the file's first bytes. The
 * client-supplied MIME type is never trusted. SVG is deliberately not
 * allowed because it can contain scripts.
 */
function detectImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: "image/png", ext: "png" };
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  // AVIF: .... "ftypavif"
  if (startsWith(bytes, [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], 4)) {
    return { mime: "image/avif", ext: "avif" };
  }
  return null;
}

/** Storage paths this module produces, e.g. "products/<uuid>.jpg". */
export const STORAGE_PATH_PATTERN =
  /^[a-z0-9-]+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/;

export class StorageService {
  /**
   * Validates and uploads one image, returning its storage path and
   * public URL.
   */
  static async uploadImage(file: File, folder = "products") {
    if (file.size === 0) {
      throw AppError.badRequest(`"${file.name}" is empty`);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw AppError.badRequest(
        `"${file.name}" is larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB`,
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const type = detectImageType(buffer);
    if (!type) {
      throw AppError.badRequest(
        `"${file.name}" is not a supported image (JPEG, PNG, WebP or AVIF)`,
      );
    }

    const path = `${folder}/${randomUUID()}.${type.ext}`;
    const bucket = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET);

    const { error } = await bucket.upload(path, buffer, {
      contentType: type.mime,
      upsert: false,
    });
    if (error) {
      console.error("Supabase upload failed:", error);
      throw new Error("Image upload failed");
    }

    return { path, url: bucket.getPublicUrl(path).data.publicUrl };
  }

  /**
   * Uploads several images. If an upload fails part-way, the files
   * already uploaded are removed so no orphans are left behind.
   */
  static async uploadImages(files: File[], folder = "products") {
    if (files.length === 0) throw AppError.badRequest("No images provided");
    if (files.length > MAX_IMAGES_PER_UPLOAD) {
      throw AppError.badRequest(`You can upload at most ${MAX_IMAGES_PER_UPLOAD} images at once`);
    }

    const uploaded: { path: string; url: string }[] = [];
    try {
      for (const file of files) {
        uploaded.push(await StorageService.uploadImage(file, folder));
      }
    } catch (error) {
      if (uploaded.length > 0) {
        await StorageService.deleteImages(uploaded.map((u) => u.path)).catch((cleanupError) =>
          console.error("Failed to clean up partial upload:", cleanupError),
        );
      }
      throw error;
    }
    return uploaded;
  }

  static async deleteImages(paths: string[]) {
    const { error } = await supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).remove(paths);
    if (error) {
      console.error("Supabase delete failed:", error);
      throw new Error("Image deletion failed");
    }
  }

  static async deleteImage(path: string) {
    if (!STORAGE_PATH_PATTERN.test(path)) {
      throw AppError.badRequest("Invalid image path");
    }
    await StorageService.deleteImages([path]);
  }

  /**
   * Maps a public URL of this app's bucket back to its storage path.
   * Returns null for any URL that isn't one of our uploaded images
   * (external URLs, other buckets, unexpected file names).
   */
  static pathFromPublicUrl(url: string): string | null {
    let parsed: URL;
    let base: URL;
    try {
      parsed = new URL(url);
      base = new URL(env.SUPABASE_URL);
    } catch {
      return null;
    }
    if (parsed.origin !== base.origin) return null;

    const prefix = `/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/`;
    if (!parsed.pathname.startsWith(prefix)) return null;

    const path = decodeURIComponent(parsed.pathname.slice(prefix.length));
    return STORAGE_PATH_PATTERN.test(path) ? path : null;
  }

  /**
   * Best-effort removal of the files behind the given public URLs.
   * URLs that aren't ours are ignored. Never throws: a storage hiccup
   * must not fail an operation whose database work already succeeded.
   */
  static async deleteByUrls(urls: string[]) {
    const paths = urls
      .map((u) => StorageService.pathFromPublicUrl(u))
      .filter((p): p is string => p !== null);
    if (paths.length === 0) return;

    try {
      await StorageService.deleteImages(paths);
    } catch (error) {
      console.error("Storage cleanup failed for:", paths, error);
    }
  }
}
