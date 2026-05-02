import express from "express";
import { listPublicCategories } from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", listPublicCategories);

export default router;
