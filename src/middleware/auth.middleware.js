import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

//
//  PROTECT ROUTES (AUTH MIDDLEWARE)
//
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    // Get JWT secret from DB
    const jwtConfig = await prisma.appConfig.findUnique({
      where: { key: "jwt_secret" },
    });

    const jwtSecret = jwtConfig?.value || "default_secret";

    // Verify token
    const decoded = jwt.verify(token, jwtSecret);

    // Attach user info
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid token",
    });
  }
};

//
//  ROLE BASED ACCESS
//
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    next();
  };
};