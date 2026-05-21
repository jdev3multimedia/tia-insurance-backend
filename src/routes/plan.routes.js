import express from "express";
import {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} from "../controllers/plan.controller.js";

import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// READ → all roles
router.get(
  "/",
  authorize("ADMIN", "SUPER_ADMIN", "EMPLOYEE", "AGENT", "CUSTOMER"),
  getAllPlans
);

router.get(
  "/:id",
  authorize("ADMIN", "SUPER_ADMIN", "EMPLOYEE", "AGENT", "CUSTOMER"),
  getPlanById
);

// WRITE → admin only
router.post("/", authorize("ADMIN", "SUPER_ADMIN"), createPlan);
router.put("/:id", authorize("ADMIN", "SUPER_ADMIN"), updatePlan);
router.delete("/:id", authorize("ADMIN", "SUPER_ADMIN"), deletePlan);

export default router;