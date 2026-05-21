import "./config/loadEnv.js";
import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { getEmailMode, verifyEmailConnection } from "./utils/sendEmail.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  try {
    const emailCheck = await verifyEmailConnection();
    if (emailCheck.ok) {
      console.log(`[ToyKart] Email ready: ${emailCheck.mode} (${emailCheck.user})`);
    } else {
      console.warn("[ToyKart] Email: dev mode — emails print to console only");
    }
  } catch (err) {
    console.error("[ToyKart] Email connection FAILED:", err.message);
    console.error("  Fix GMAIL_USER / GMAIL_APP_PASSWORD in server/.env and restart.");
  }

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
