import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";

import config, { assertConfig } from "./config/index.js";
import { corsOptions } from "./config/cors.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import routes from "./routes/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* =====================================================================
   Express application factory
   ---------------------------------------------------------------------
   Separating app creation from the HTTP server keeps the app testable
   (Supertest imports this module directly — no port is ever bound) and
   lets the same code run under server.js, Lambda or a custom runtime.
   ===================================================================== */
export function createApp() {
  assertConfig();

  const app = express();

  /* --------------------------- security ---------------------------- */
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false, // JSON API only — no HTML is served
      hsts: config.isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
    })
  );

  app.use(cors(corsOptions));

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(cookieParser());
  app.use(mongoSanitize()); // strip $ / . operators from user input

  app.use(
    morgan(config.isProd ? "combined" : "dev", {
      skip: () => config.isTest, // silence request logs under Jest
    })
  );

  /* ---------------------------- static ----------------------------- */
  // Local fallback for uploads when Cloudinary is not configured
  const uploadsDir = path.resolve(__dirname, "../uploads");
  app.use("/uploads", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  });
  app.use(
    "/uploads",
    express.static(uploadsDir, { maxAge: "7d", index: false })
  );

  /* ---------------------------- health ----------------------------- */
  app.get("/api/health", (_req, res) =>
    res.json({
      success: true,
      data: {
        status: "ok",
        env: config.env,
        paymentMode: config.payments.mode,
        cloudinary: Boolean(config.cloudinary.apiKey),
        smtp: config.smtp.configured,
        uptime: Math.round(process.uptime()),
        version: "1.0.0",
        time: new Date().toISOString(),
      },
    })
  );

  /* ----------------------------- routes ---------------------------- */
  app.use("/api/v1", apiLimiter, routes);

  /* --------------------------- 404 + errors ------------------------ */
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
