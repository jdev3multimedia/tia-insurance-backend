import express from "express";

import {
  getAllPolicyAddons,
  getPolicyAddonById,
  createPolicyAddon,
  updatePolicyAddon,
  deletePolicyAddon,
} from "../controllers/policyAddon.controller.js";

import {
  protect,
  authorize,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// READ

router.get(
  "/",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "EMPLOYEE",
    "AGENT",
    "CUSTOMER"
  ),
  getAllPolicyAddons
);

router.get(
  "/:id",
  authorize(
    "ADMIN",
    "SUPER_ADMIN",
    "EMPLOYEE",
    "AGENT",
    "CUSTOMER"
  ),
  getPolicyAddonById
);

// WRITE

router.post(
  "/",
  authorize("ADMIN", "SUPER_ADMIN"),
  createPolicyAddon
);

router.put(
  "/:id",
  authorize("ADMIN", "SUPER_ADMIN"),
  updatePolicyAddon
);

router.delete(
  "/:id",
  authorize("ADMIN", "SUPER_ADMIN"),
  deletePolicyAddon
);

export default router;