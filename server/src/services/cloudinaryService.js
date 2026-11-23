import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiResponse.js";

/**
 * Uploads a multer file to Cloudinary when configured, else falls back to
 * local disk storage. Returns a normalised asset descriptor either way.
 */
export async function uploadAsset(file, { folder = "misc", resourceType = "image", isPrivate = false } = {}) {
  if (!file) throw ApiError.badRequest("No file supplied");

  if (!isCloudinaryConfigured()) {
    return {
      storage: "local",
      url: `/uploads/${folder}/${file.filename}`,
      publicId: null,
      resourceType,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      isPrivate,
    };
  }

  const sub = `${process.env.CLOUDINARY_FOLDER || "eventsphere"}/${folder}`;
  const opts = {
    folder: sub,
    resource_type: resourceType === "raw" ? "raw" : "image",
    // private documents use unsigned access + a signed delivery URL
    type: isPrivate ? "authenticated" : "upload",
    unique_filename: true,
    overwrite: false,
  };

  return new Promise((resolve, reject) => {
    const uploadFn = resourceType === "raw"
      ? cloudinary.uploader.upload_stream
      : cloudinary.uploader.upload_stream;

    const stream = uploadFn(opts, (err, result) => {
      if (err) return reject(ApiError.server(`Upload failed: ${err.message}`));
      resolve({
        storage: "cloudinary",
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        filename: result.public_id.split("/").pop(),
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: result.bytes ?? file.size,
        isPrivate,
        signature: result.signature,
      });
    });

    if (file.buffer) stream.end(file.buffer);
    else if (file.path) require("fs").createReadStream(file.path).pipe(stream);
    else reject(ApiError.badRequest("Unsupported file source"));
  });
}

/** Deletes from Cloudinary; safe to call for local assets (no-op). */
export async function destroyAsset(publicId, resourceType = "image") {
  if (!publicId || !isCloudinaryConfigured()) return { ok: true, skipped: true };
  try {
    const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return { ok: res.result === "ok", result: res.result };
  } catch (err) {
    console.error("Cloudinary destroy failed:", err.message);
    return { ok: false, error: err.message };
  }
}

/** Replaces an asset — uploads the new one first, then removes the old. */
export async function replaceAsset(file, oldPublicId, opts) {
  const uploaded = await uploadAsset(file, opts);
  if (oldPublicId) await destroyAsset(oldPublicId, opts?.resourceType);
  return uploaded;
}

/** Signed URL for a private (authenticated) Cloudinary document. */
export function signedUrl(publicId, { resourceType = "raw", expiresIn = 3600 } = {}) {
  if (!isCloudinaryConfigured() || !publicId) return null;
  return cloudinary.url(publicId, {
    type: "authenticated",
    resource_type: resourceType,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    secure: true,
  });
}

export default { uploadAsset, destroyAsset, replaceAsset, signedUrl };
