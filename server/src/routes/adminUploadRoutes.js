import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";
import { uploadProductImage } from "../middleware/uploadProductImage.js";
import { uploadAdminProductImage } from "../controllers/adminUploadController.js";

const router = express.Router();

router.use(protect, admin);

router.post("/", (req, res) => {
  uploadProductImage(req, res, (err) => {
    if (err) {
      const message = err.message || "Upload failed";
      return res.status(400).json({ message });
    }
    return uploadAdminProductImage(req, res);
  });
});

export default router;
