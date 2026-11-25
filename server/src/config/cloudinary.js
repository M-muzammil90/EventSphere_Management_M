import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary is OPTIONAL. When credentials are absent the app falls back to
 * local disk storage under /uploads so the project still runs offline.
 */
export const isCloudinaryConfigured = () =>
  process.env.NODE_ENV !== "test" &&
  Boolean(
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) ||
    process.env.CLOUDINARY_URL
  );

if (isCloudinaryConfigured()) {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Defensive sanitization in case full CLOUDINARY_URL was pasted into CLOUDINARY_API_SECRET
  if (apiSecret && (apiSecret.includes("cloudinary://") || apiSecret.includes("@"))) {
    const match = apiSecret.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (match) {
      apiKey = match[1];
      apiSecret = match[2];
      cloudName = match[3];
    }
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log("✔ Cloudinary configured:", cloudName);
} else {
  console.log("ℹ Cloudinary not configured — using local disk storage (/uploads)");
}

export default cloudinary;
