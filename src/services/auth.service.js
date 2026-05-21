import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { generateTokens } from "../utils/token.js";

export const loginService = async (identifier, password) => {
  // Detect email vs phone
  const isEmail = identifier.includes("@");

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        {
          email: isEmail ? identifier.toLowerCase() : undefined,
        },
        {
          mobile: !isEmail ? identifier : undefined,
        },
      ],
    },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Password check
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // ❗ Not verified → resend OTP
  if (!user.isVerified) {
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

    const error = new Error(
      "Account not verified. A new OTP has been sent."
    );

    error.status = 403;

    error.data = {
      verificationRequired: true,
      otpSent: true,
      role: user.role,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      verificationType:
        roleConfig?.verificationMethod || "EMAIL",
      ...(process.env.NODE_ENV === "development" && {
        otp,
      }),
    };

    throw error;
  }

  // Generate tokens
  const { accessToken, refreshToken } =
    await generateTokens(user);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ),
    },
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};