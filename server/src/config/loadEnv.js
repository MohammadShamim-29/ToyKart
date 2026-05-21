import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../payment.env") });
dotenv.config();

// Normalize Gmail app password (Google displays with spaces)
if (process.env.GMAIL_APP_PASSWORD) {
  process.env.GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, "");
}
