import express from "express";
import multer from "multer";
import path from "path";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const ALLOWED_TYPES = /jpg|jpeg|png|gif|webp|mp4|webm|mov|avi/;

function checkFileType(file, cb) {
  const extname = ALLOWED_TYPES.test(path.extname(file.originalname).toLowerCase());
  const mimetype = ALLOWED_TYPES.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Only image and video files are allowed (jpg, jpeg, png, gif, webp, mp4, webm, mov, avi)"));
}

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  }
});

router.post("/", protect, (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || err });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file received" });
    }

    const port = process.env.PORT || 5000;
    const publicBase =
      process.env.SERVER_PUBLIC_URL?.replace(/\/$/, "") || `http://localhost:${port}`;

    const url = `${publicBase}/uploads/${req.file.filename}`;
    return res.status(201).json({ url });
  });
});

export default router;
