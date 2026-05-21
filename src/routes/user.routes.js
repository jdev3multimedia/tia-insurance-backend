import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// 🔐 All routes require login
router.use(protect);

// 👇 Only ADMIN / EMPLOYEE can see all users
router.get("/", allowRoles("ADMIN", "SUPER_ADMIN"), getUsers);

// 👇 Only ADMIN can create users
router.post("/", allowRoles("ADMIN"), createUser);

// 👇 User can see own profile OR admin
router.get("/:id", getUserById);

// 👇 User can update own profile OR admin
router.put("/:id", updateUser);

// 👇 Only ADMIN / SUPER_ADMIN can delete
router.delete("/:id", allowRoles("ADMIN", "SUPER_ADMIN"), deleteUser);

export default router;