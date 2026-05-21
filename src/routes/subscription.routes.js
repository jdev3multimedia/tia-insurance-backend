import express from "express";
import {
  subscribe,
  getAllSubscriptions,
  getSubscriptionById,
} from "../controllers/subscription.controller.js";

import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// USER subscribe
router.post(
  "/subscribe",
  authorize("CUSTOMER", "AGENT", "EMPLOYEE","ADMIN", "SUPER_ADMIN"),
  subscribe
);

// USER or ADMIN view single
router.get(
  "/:id",
  authorize("CUSTOMER", "AGENT", "EMPLOYEE", "ADMIN", "SUPER_ADMIN"),
  getSubscriptionById
);

// ADMIN view all
router.get(
  "/",
  authorize("ADMIN", "SUPER_ADMIN"),
  getAllSubscriptions
);

export default router;