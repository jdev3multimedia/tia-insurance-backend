import express from "express";
import {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  logout,
  refreshToken,
} from "../controllers/auth.controller.js";


const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

export default router;