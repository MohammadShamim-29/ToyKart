import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProduct,
  listAdminProducts,
  updateAdminProduct
} from "../controllers/adminProductController.js";

const router = express.Router();

router.use(protect, admin);

router.route("/").get(listAdminProducts).post(createAdminProduct);
router.route("/:id").get(getAdminProduct).put(updateAdminProduct).delete(deleteAdminProduct);

export default router;
