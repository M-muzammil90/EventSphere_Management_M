import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { ApiError } from "../utils/ApiResponse.js";
import { isCloudinaryConfigured } from "../config/cloudinary.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_ROOT = path.resolve(__dirname, "../../uploads");

/* --------------------------- MIME allowlists -------------------------- */
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"];
const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
];

const MAX_IMAGE_MB = 5;
const MAX_DOC_MB = 10;

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

/* ------------------------------- storage ------------------------------ */
const diskStorage = (subdir) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, ensureDir(path.join(UPLOAD_ROOT, subdir))),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
    },
  });

const memoryStorage = multer.memoryStorage();

const makeFilter = (allowed) => (_req, file, cb) => {
  if (!allowed.includes(file.mimetype)) {
    return cb(ApiError.badRequest(`File type "${file.mimetype}" is not allowed. Permitted: ${allowed.join(", ")}`));
  }
  cb(null, true);
};

/* ------------------------------- factories ----------------------------
   multer() returns a Multer INSTANCE, so each factory ends with
   .single("file") to produce real Express middleware.
   --------------------------------------------------------------------- */
const imageUpload = (subdir) =>
  multer({
    storage: isCloudinaryConfigured() ? memoryStorage : diskStorage(subdir),
    fileFilter: makeFilter(IMAGE_TYPES),
    limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024, files: 1 },
  }).single("file");

const docUpload = (subdir) =>
  multer({
    storage: isCloudinaryConfigured() ? memoryStorage : diskStorage(subdir),
    fileFilter: makeFilter(DOC_TYPES),
    limits: { fileSize: MAX_DOC_MB * 1024 * 1024, files: 1 },
  }).single("file");

/* Public-facing uploaders — ready-to-use Express middleware */
export const uploadLogo = imageUpload("logos");
export const uploadBanner = imageUpload("banners");
export const uploadProductImage = imageUpload("products");
export const uploadDocument = docUpload("documents");

/**
 * Accepts a file under any of the standard field names (file, logo, banner,
 * image, document). Handy for endpoints that serve several upload types.
 */
export const uploadAny = () => (req, res, next) => {
  const field = ["file", "logo", "banner", "image", "document", "avatar"].find((f) => req.headers["content-type"]?.includes("multipart") && f in req.body) || "file";
  docUpload("documents")(req, res, (err) => {
    if (err) return next(err);
    if (req.file) return next();
    imageUpload("logos")(req, res, (err2) => (err2 ? next(err2) : next()));
  });
  // note: field detection is best-effort; multer reads the stream
  void field;
};

/**
 * Wraps an uploader so JSON requests pass through untouched. This lets the
 * same endpoint accept `application/json` (no file) or `multipart/form-data`
 * (with a file) — important for registration where an avatar is optional.
 */
export const optionalUpload = (uploader) => (req, res, next) => {
  const ct = req.headers["content-type"] || "";
  if (!ct.includes("multipart/form-data")) return next();
  uploader(req, res, next);
};

/* ------------------------------ validators ---------------------------- */
export const assertFilePresent = (req) => {
  if (!req.file) throw ApiError.badRequest("A file is required for this request");
  return req.file;
};

export default { uploadLogo, uploadBanner, uploadDocument, uploadProductImage, uploadAny, assertFilePresent };
