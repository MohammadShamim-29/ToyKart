import express from "express";
import { listCheckoutShippingLocations } from "../controllers/shippingController.js";

const router = express.Router();

router.get("/locations", listCheckoutShippingLocations);

export default router;
