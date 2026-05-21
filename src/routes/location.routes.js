import express from "express";
import {
  getAllLocation,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../controllers/location.controller.js";

import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// READ → all roles
router.get(
  "/",
  authorize("ADMIN", "SUPER_ADMIN", "EMPLOYEE", "AGENT", "CUSTOMER"),
  getAllLocation
);
router.get(
  "/:id",
  authorize("ADMIN", "SUPER_ADMIN", "EMPLOYEE", "AGENT", "CUSTOMER"),
  getLocationById
);

// WRITE → admin only
router.post("/", authorize("ADMIN", "SUPER_ADMIN"), createLocation);
router.put("/:id", authorize("ADMIN", "SUPER_ADMIN"), updateLocation);
router.delete("/:id", authorize("ADMIN", "SUPER_ADMIN"), deleteLocation);

export default router;