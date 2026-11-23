import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary is OPTIONAL. When credentials are absent the app falls back to
 * local disk storage under /uploads so the project still runs offline.
 */
export const isCloudinaryConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log("✔ Cloudinary configured:", process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.log("ℹ Cloudinary not configured — using local disk storage (/uploads)");
}

export default cloudinary;
