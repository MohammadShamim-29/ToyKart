import "./config/loadEnv.js";
import "express-async-errors";
import express from "express";
import path from "path";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import adminCategoryRoutes from "./routes/adminCategoryRoutes.js";
import adminProductRoutes from "./routes/adminProductRoutes.js";
import adminUploadRoutes from "./routes/adminUploadRoutes.js";
import shippingRoutes from "./routes/shippingRoutes.js";
import adminShippingCountryRoutes from "./routes/adminShippingCountryRoutes.js";
import adminShippingDistrictRoutes from "./routes/adminShippingDistrictRoutes.js";
import adminOrderRoutes from "./routes/adminOrderRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import adminInventoryRoutes from "./routes/adminInventoryRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import returnRequestRoutes from "./routes/returnRequestRoutes.js";
import adminReturnRequestRoutes from "./routes/adminReturnRequestRoutes.js";
import refundRoutes from "./routes/refundRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const devOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const corsOrigin =
  process.env.NODE_ENV === "production"
    ? process.env.CLIENT_URL || false
    : [...new Set([...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []), ...devOrigins])];

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(mongoSanitize());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/returns", returnRequestRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/upload", adminUploadRoutes);
app.use("/api/admin/shipping-countries", adminShippingCountryRoutes);
app.use("/api/admin/shipping-districts", adminShippingDistrictRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/inventory", adminInventoryRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/returns", adminReturnRequestRoutes);
app.use("/api/upload", uploadRoutes);

app.use(notFound);
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[ToyKart Error] ${req.method} ${req.url}`, err.stack);
  }
  errorHandler(err, req, res, next);
});

export default app;
