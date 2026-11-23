import "dotenv/config";

/* =====================================================================
   Centralised configuration
   ---------------------------------------------------------------------
   Every environment read happens here once, validated at boot, so no
   controller ever touches process.env directly. Swap this file to move
   to a hosted config service (AWS SSM, Vault, etc.) without touching
   business code.
   ===================================================================== */

const required = (key, fallback) => {
  const v = process.env[key] ?? fallback;
  if (v === undefined) throw new Error(`Missing required environment variable: ${key}`);
  return v;
};

const int = (key, fallback) => {
  const v = process.env[key];
  return v === undefined || v === "" ? fallback : parseInt(v, 10);
};

const bool = (key, fallback = false) => {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
};

const list = (key, fallback = []) =>
  (process.env[key] ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .concat(fallback);

const isProd = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

export const config = {
  env: process.env.NODE_ENV ?? "development",
  isProd,
  isTest,
  port: int("PORT", 5000),

  mongo: {
    uri: isTest ? process.env.MONGO_URI_TEST : required("MONGO_URI", "mongodb://127.0.0.1:27017/eventsphere"),
    dbName: "eventsphere",
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? (isTest ? "test_secret_at_least_32_characters_long" : ""),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    cookieName: process.env.JWT_COOKIE_NAME ?? "es_token",
    cookieSecure: bool("JWT_COOKIE_SECURE", isProd),
    cookieSameSite: process.env.JWT_COOKIE_SAME_SITE ?? (isProd ? "none" : "lax"),
    cookieMaxAge: 7 * 24 * 60 * 60 * 1000,
  },

  cors: {
    origins: list("CORS_ORIGINS", [process.env.CLIENT_URL].filter(Boolean).concat(["http://localhost:5173"])),
    clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
    folder: process.env.CLOUDINARY_FOLDER ?? "eventsphere",
  },

  rateLimit: {
    windowMs: int("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
    max: int("RATE_LIMIT_MAX", 300),
    authMax: int("AUTH_RATE_LIMIT_MAX", 20),
  },

  uploads: {
    maxImageMb: 5,
    maxDocMb: 10,
    root: new URL("../../uploads/", import.meta.url).pathname,
  },

  payments: {
    mode: process.env.PAYMENT_MODE === "live" ? "live" : "demo",
    isDemo: (process.env.PAYMENT_MODE ?? "demo") === "demo",
    defaultTaxRate: int("DEFAULT_TAX_RATE", 5),
    currency: process.env.CURRENCY ?? "USD",
  },

  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: int("SMTP_PORT", 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.EMAIL_FROM ?? "EventSphere <no-reply@eventsphere.io>",
    configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  },

  seed: {
    adminName: process.env.SEED_ADMIN_NAME ?? "EventSphere Owner",
    adminEmail: (process.env.SEED_ADMIN_EMAIL ?? "admin@eventsphere.io").toLowerCase(),
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026",
  },
};

/** Fails fast at boot when production secrets are missing or weak. */
export function assertConfig() {
  const errors = [];

  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    errors.push("JWT_SECRET must be set to at least 32 characters");
  }
  if (!config.mongo.uri) errors.push("MONGO_URI must be set");
  if (config.isProd) {
    if (!config.jwt.cookieSecure) errors.push("JWT_COOKIE_SECURE must be true in production");
    if (config.cors.origins.includes("*")) errors.push("CORS_ORIGINS must not be '*' in production");
    if (config.seed.adminPassword === "ChangeMe!2026") errors.push("SEED_ADMIN_PASSWORD must be changed from the default");
  }

  if (errors.length) {
    throw new Error("Invalid configuration:\n  - " + errors.join("\n  - "));
  }
  return true;
}

export default config;
