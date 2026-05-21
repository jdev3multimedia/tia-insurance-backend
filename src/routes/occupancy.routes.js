import express from "express";
import {
  getAllOccupancy,
  getOccupancyById,
  createOccupancy,
  updateOccupancy,
  deleteOccupancy,
  searchOccupancy
} from "../controllers/occupancy.controller.js";

import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// Everyone can READ
router.get("/", authorize("ADMIN", "SUPER_ADMIN", "EMPLOYEE", "AGENT", "CUSTOMER"), getAllOccupancy);
router.get("/:id", authorize("ADMIN", "SUPER_ADMIN", "EMPLOYEE", "AGENT", "CUSTOMER"), getOccupancyById);

// Only Admin can MODIFY
router.post("/", authorize("ADMIN", "SUPER_ADMIN"), createOccupancy);
router.put("/:id", authorize("ADMIN", "SUPER_ADMIN"), updateOccupancy);
router.delete("/:id", authorize("ADMIN", "SUPER_ADMIN"), deleteOccupancy);

router.get(
  "/search/by-text",
  authorize("ADMIN", "SUPER_ADMIN", "EMPLOYEE", "AGENT", "CUSTOMER"),
  searchOccupancy
);

export default router;