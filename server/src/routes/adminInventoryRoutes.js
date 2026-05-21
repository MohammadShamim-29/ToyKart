import express from "express";
import {
  getInventoryProductStock,
  listInventoryCategories,
  listInventoryProductsByCategory
} from "../controllers/adminInventoryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect, admin);
router.get("/categories", listInventoryCategories);
router.get("/products", listInventoryProductsByCategory);
router.get("/products/:id", getInventoryProductStock);

export default router;
