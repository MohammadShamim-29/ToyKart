import express from "express";
import { getProductById, getProducts, getProductSuggestions } from "../controllers/productController.js";
import { createProductReview, getProductReviews } from "../controllers/reviewController.js";
import { optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/suggest", getProductSuggestions);
router.get("/:id/reviews", getProductReviews);
router.post("/:id/reviews", optionalProtect, createProductReview);
router.get("/:id", getProductById);

export default router;
