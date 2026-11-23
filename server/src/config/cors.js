const allowed = () =>
  (process.env.CORS_ORIGINS || process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

export const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server / curl (no Origin header) in non-production
    if (!origin) return callback(null, true);
    const list = allowed();
    if (list.includes(origin) || list.includes("*")) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Cache-Control"],
  exposedHeaders: ["set-cookie"],
  maxAge: 86400,
};

export default corsOptions;
