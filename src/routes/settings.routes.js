import express from "express";
import {
  getSettings,
  updateSettings,
} from "../controllers/settings.controller.js";

import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Admin only
router.get("/", protect, authorize("ADMIN", "SUPER_ADMIN"), getSettings);
router.put("/", protect, authorize("ADMIN", "SUPER_ADMIN"), updateSettings);

export default router;