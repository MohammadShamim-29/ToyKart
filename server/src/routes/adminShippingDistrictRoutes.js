import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";
import {
  createAdminShippingDistrict,
  deleteAdminShippingDistrict,
  getAdminShippingDistrict,
  listAdminShippingDistricts,
  updateAdminShippingDistrict
} from "../controllers/adminShippingDistrictController.js";

const router = express.Router();

router.use(protect, admin);

router.route("/").get(listAdminShippingDistricts).post(createAdminShippingDistrict);
router
  .route("/:id")
  .get(getAdminShippingDistrict)
  .put(updateAdminShippingDistrict)
  .delete(deleteAdminShippingDistrict);

export default router;
