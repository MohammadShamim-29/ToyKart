import dotenv from "dotenv";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Always load server/.env regardless of where the command is run from.
dotenv.config({ path: path.resolve(__dirname, "../.env") });
// Optional shared env file at repo root.
dotenv.config({ path: path.resolve(__dirname, "../../payment.env") });
// Also allow root-level .env overrides if present.
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  const server = http.createServer(app);

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\n[ToyKart] Port ${PORT} is already in use (another node process is still bound to it).\n` +
          `  Free it, then restart, e.g.:\n` +
          `    fuser -k ${PORT}/tcp\n` +
          `  or:  kill $(lsof -t -i :${PORT})\n`
      );
      process.exit(1);
    }
    throw err;
  });

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

startServer();
