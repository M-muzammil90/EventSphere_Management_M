import "dotenv/config";
import http from "node:http";
import { Server as SocketServer } from "socket.io";

import config from "./src/config/index.js";
import connectDB from "./src/config/db.js";
import { createApp } from "./src/app.js";
import { attachIO } from "./src/services/socketService.js";

/* =====================================================================
   HTTP + WebSocket bootstrap
   ---------------------------------------------------------------------
   Responsibilities kept deliberately narrow:
     1. connect MongoDB
     2. build the Express app
     3. wrap it in an HTTP server and attach Socket.IO
     4. bind the port and handle shutdown
   ===================================================================== */

const app = createApp();
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: config.cors.origins,
    credentials: true,
  },
  transports: ["websocket", "polling"],
});
attachIO(io);

async function start() {
  try {
    await connectDB();

    server.listen(config.port, () => {
      const line = "─".repeat(46);
      console.log(line);
      console.log("  EventSphere API");
      console.log(`  Environment : ${config.env}`);
      console.log(`  Listening   : http://localhost:${config.port}`);
      console.log(`  REST base   : http://localhost:${config.port}/api/v1`);
      console.log(`  Health      : http://localhost:${config.port}/api/health`);
      console.log(`  Client URL  : ${config.cors.clientUrl}`);
      console.log(`  Payments    : ${config.payments.mode.toUpperCase()} mode`);
      console.log(`  Storage     : ${config.cloudinary.apiKey ? "Cloudinary" : "local disk (/uploads)"}`);
      console.log(line);
    });
  } catch (err) {
    console.error("✖ Failed to start server:", err.message);
    process.exit(1);
  }
}

/* --------------------------- graceful shutdown ---------------------- */
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully…`);

  // Stop accepting new connections, then close existing ones
  server.close(() => {
    io.close();
    console.log("  HTTP and WebSocket servers closed");
    process.exit(0);
  });

  // Hard-exit if graceful shutdown stalls
  setTimeout(() => {
    console.warn("  Graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  // Keep serving — one bad promise should not take the process down
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown("uncaughtException");
});

// Only bind a port when this file is the entry point (node server.js).
// Under Jest we import the module and never want to listen.
const isEntryPoint = process.argv[1] && process.argv[1].endsWith("server.js");
if (isEntryPoint) start();

export { app, server, io };
export default app;
