import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategory,
  listAdminCategories,
  updateAdminCategory
} from "../controllers/adminCategoryController.js";

const router = express.Router();

router.use(protect, admin);

router.route("/").get(listAdminCategories).post(createAdminCategory);
router.route("/:id").get(getAdminCategory).put(updateAdminCategory).delete(deleteAdminCategory);

export default router;
