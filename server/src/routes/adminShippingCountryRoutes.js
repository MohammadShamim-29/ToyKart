import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";
import {
  createAdminShippingCountry,
  deleteAdminShippingCountry,
  getAdminShippingCountry,
  listAdminShippingCountries,
  updateAdminShippingCountry
} from "../controllers/adminShippingCountryController.js";

const router = express.Router();

router.use(protect, admin);

router.route("/").get(listAdminShippingCountries).post(createAdminShippingCountry);
router.route("/:id").get(getAdminShippingCountry).put(updateAdminShippingCountry).delete(deleteAdminShippingCountry);

export default router;
