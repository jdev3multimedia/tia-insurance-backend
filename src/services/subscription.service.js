import prisma from "../config/prisma.js";

export const getAll = async ({
  page,
  limit,
  search,
  sortBy,
  order,
  status,
  userId,
  planId,
}) => {
  const skip = (page - 1) * limit;

  const allowedSortFields = [
    "id",
    "startDate",
    "endDate",
    "status",
    "createdAt",
  ];

  const safeSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : "id";

  const where = {
    ...(search && {
      OR: [
        { status: { contains: search } },
      ],
    }),

    ...(status && { status }),

    ...(userId && { userId: Number(userId) }),

    ...(planId && { planId: Number(planId) }),
  };

  const total = await prisma.subscription.count({ where });

  const data = await prisma.subscription.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      [safeSortBy]: order === "asc" ? "asc" : "desc",
    },
    include: {
      plan: true, // optional enrichment
    },
  });

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getById = (id) => {
  return prisma.subscription.findUnique({
    where: { id },
    include: {
      plan: true,
    },
  });
};

// USER subscription creations
export const createSubscription = async (userId, planId) => {
  const plan = await prisma.plan.findUnique({
    where: { id: Number(planId) },
  });

  console.log("Creating subscription for userId:", userId, "with planId:", planId);return;

  if (!plan) throw new Error("Plan not found");

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + plan.duration_days);

  return prisma.subscription.create({
    data: {
      userId,
      planId: plan.id,
      startDate,
      endDate,
      status: "active",
    },
  });
};

export const update = (id, data) => {
  return prisma.subscription.update({
    where: { id },
    data,
  });
};

// soft delete
export const remove = (id) => {
  return prisma.subscription.update({
    where: { id },
    data: { status: "cancelled" },
  });
};