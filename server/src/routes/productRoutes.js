import express from "express";
import { getProductById, getProducts, getProductSuggestions } from "../controllers/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/suggest", getProductSuggestions);
router.get("/:id", getProductById);

export default router;
