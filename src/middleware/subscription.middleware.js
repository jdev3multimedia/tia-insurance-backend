import prisma from "../config/prisma.js";

export const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const sub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
        endDate: { gt: new Date() },
      },
    });

    if (!sub) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required",
      });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Subscription check failed" });
  }
};