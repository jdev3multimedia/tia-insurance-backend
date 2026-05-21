import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginService } from "../services/auth.service.js";

//
//   REFRESH TOKEN
//
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const storedToken = await prisma.refreshToken.findFirst({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      return res.status(403).json({
        success: false,
        message: "Refresh token not found (invalid session)",
      });
    }

    if (new Date(storedToken.expiresAt) < new Date()) {
      return res.status(403).json({
        success: false,
        message: "Refresh token expired",
      });
    }

    const jwtConfig = await prisma.appConfig.findUnique({
      where: { key: "jwt_secret" },
    });

    const jwtSecret = jwtConfig?.value;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "JWT secret missing in config",
      });
    }

    const decoded = jwt.verify(refreshToken, jwtSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { generateTokens } = await import("../utils/token.js");

    const tokens = await generateTokens(user);

    return res.json({
      success: true,
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};


//
//   REGISTER
//
export const register = async (req, res) => {
  try {
    let { email, password, name, mobile, role } = req.body;

    email = email?.toLowerCase();
    role = role?.toUpperCase();

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password and role are required",
      });
    }

    const allowedRoles = ["CUSTOMER", "AGENT", "EMPLOYEE"];

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Registration not allowed for this role",
      });
    }

    if (
      (role === "CUSTOMER" || role === "AGENT") &&
      (!mobile || mobile.trim() === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required for this role",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        mobile,
        role,
        isVerified: false,
      },
    });

    const roleConfig = await prisma.roleConfig.findUnique({
      where: { role },
    });

    let otp = null;
    let verificationType = roleConfig?.verificationMethod || "EMAIL";

    // OTP GENERATION
    if (roleConfig?.otpEnabled) {
      await prisma.otp.updateMany({
        where: {
          userId: user.id,
          isUsed: false,
        },
        data: {
          isUsed: true,
        },
      });

      const otpLengthConfig = await prisma.appConfig.findUnique({
        where: { key: "otp_length" },
      });

      const otpLength = otpLengthConfig
        ? parseInt(otpLengthConfig.value)
        : 6;

      otp = Math.floor(
        10 ** (otpLength - 1) +
          Math.random() * (9 * 10 ** (otpLength - 1))
      ).toString();

      const expiryConfig = await prisma.appConfig.findUnique({
        where: { key: "otp_expiry_sec" },
      });

      const expirySeconds = expiryConfig
        ? parseInt(expiryConfig.value)
        : 300;

      await prisma.otp.create({
        data: {
          userId: user.id,
          otpCode: otp,
          type: verificationType,
          expiresAt: new Date(
            Date.now() + expirySeconds * 1000
          ),
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: "User registered. Please verify OTP",

      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        verificationRequired: true,
        otpSent: roleConfig?.otpEnabled || false,
        verificationType,
      },

      ...(process.env.NODE_ENV === "development" && {
        otp,
      }),
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//
//   FORGOT PASSWORD
//
export const forgotPassword = async (req, res) => {
  try {
    let { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Identifier is required",
      });
    }

    const isEmail = identifier.includes("@");

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: isEmail
              ? identifier.toLowerCase()
              : undefined,
          },
          {
            mobile: !isEmail ? identifier : undefined,
          },
        ],
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const roleConfig = await prisma.roleConfig.findUnique({
      where: { role: user.role },
    });

    if (!roleConfig?.otpEnabled) {
      return res.status(400).json({
        success: false,
        message: "OTP not enabled for this role",
      });
    }

    // Invalidate old OTPs
    await prisma.otp.updateMany({
      where: {
        userId: user.id,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Generate OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP Expiry Config
    const expiryConfig = await prisma.appConfig.findUnique({
      where: { key: "otp_expiry_sec" },
    });

    const expirySeconds = expiryConfig
      ? parseInt(expiryConfig.value)
      : 300;

    // Save OTP
    await prisma.otp.create({
      data: {
        userId: user.id,
        otpCode: otp,
        type: roleConfig.verificationMethod,
        expiresAt: new Date(
          Date.now() + expirySeconds * 1000
        ),
      },
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent for password reset",

      data: {
        userId: user.id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        otpSent: true,
        verificationType:
          roleConfig.verificationMethod,
      },

      ...(process.env.NODE_ENV === "development" && {
        otp,
      }),
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// //
// //   RESET PASSWORD
// //
export const resetPassword = async (req, res) => {
  try {
    let { identifier, otp, newPassword } = req.body;

    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Identifier, OTP and new password are required",
      });
    }

    const isEmail = identifier.includes("@");

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: isEmail
              ? identifier.toLowerCase()
              : undefined,
          },
          {
            mobile: !isEmail ? identifier : undefined,
          },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingOtp = await prisma.otp.findFirst({
      where: {
        userId: user.id,
        otpCode: otp,
        isUsed: false,
      },
    });

    if (!existingOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check OTP expiry
    if (new Date(existingOtp.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    // Mark OTP as used
    await prisma.otp.update({
      where: { id: existingOtp.id },
      data: {
        isUsed: true,
      },
    });

    return res.json({
      success: true,
      message: "Password reset successful",

      data: {
        userId: user.id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//
//   VERIFY OTP
//
export const verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({
        success: false,
        message: "Identifier and OTP are required",
      });
    }

    const isEmail = identifier.includes("@");

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: isEmail ? identifier.toLowerCase() : undefined },
          { mobile: !isEmail ? identifier : undefined },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingOtp = await prisma.otp.findFirst({
      where: {
        userId: user.id,
        otpCode: otp,
        isUsed: false,
      },
    });

    if (!existingOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (new Date(existingOtp.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    await prisma.otp.update({
      where: { id: existingOtp.id },
      data: { isUsed: true },
    });

    return res.json({
      success: true,
      message: "Account verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//
//   RESEND OTP
//
export const resendOtp = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Identifier is required",
      });
    }

    const isEmail = identifier.includes("@");

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: isEmail ? identifier.toLowerCase() : undefined },
          { mobile: !isEmail ? identifier : undefined },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User is already verified",
      });
    }

    // Invalidate old OTPs
    await prisma.otp.updateMany({
      where: {
        userId: user.id,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    const roleConfig = await prisma.roleConfig.findUnique({
      where: { role: user.role },
    });

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await prisma.otp.create({
      data: {
        userId: user.id,
        otpCode: otp,
        type: roleConfig?.verificationMethod || "EMAIL",
        expiresAt: new Date(Date.now() + 300000),
      },
    });

    return res.json({
      success: true,
      message: "OTP resent successfully",
      ...(process.env.NODE_ENV === "development" && {
        otp,
      }),
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//
//  LOGIN (UPDATED)
//
export const login = async (req, res) => {
  try {
    let { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required",
      });
    }

    const result = await loginService(identifier, password);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      data: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        mobile: result.user.mobile,
        role: result.user.role,
      },
    });
  } catch (error) {
    return res.status(error.status || 400).json({
      success: false,
      message: error.message,
      data: error.data || null,
    });
  }
};

//
//   LOGOUT
//
export const logout = async (req, res) => {
  try {
    // Optionally: Delete refresh token from DB
    // For now, just return success (client should discard tokens)
    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};