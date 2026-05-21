import prisma from "../config/prisma.js";

export const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
        endDate: { gt: new Date() },
      },
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required",
      });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Subscription check failed" });
  }
};