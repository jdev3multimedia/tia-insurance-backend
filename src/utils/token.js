import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export const generateTokens = async (user) => {
  // Get secret from DB
  const jwtConfig = await prisma.appConfig.findUnique({
    where: { key: "jwt_secret" },
  });

  const jwtSecret = jwtConfig?.value || "default_secret";

  // Access Token (short life - 30 minutes)
  const accessToken = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: "500m" }
  );

  // Refresh Token (long life)
  const refreshToken = jwt.sign(
    {
      userId: user.id,
    },
    jwtSecret,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};