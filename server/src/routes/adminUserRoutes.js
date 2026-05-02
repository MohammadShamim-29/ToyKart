import express from "express";
import { deleteAdminUser, getAdminUser, listAdminUsers } from "../controllers/adminUserController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect, admin);

router.route("/").get(listAdminUsers);
router.route("/:id").get(getAdminUser).delete(deleteAdminUser);

export default router;
