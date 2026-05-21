import prisma from "../config/prisma.js";

export const getAll = async ({
  page,
  limit,
  search,
  sortBy,
  order,
  isActive,
}) => {
  const skip = (page - 1) * limit;

  // safe sort fields
  const allowedSortFields = [
    "id",
    "name",
    "price",
    "duration_days",
    "createdAt",
  ];

  const safeSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : "id";

  // filters
  const where = {
    ...(search && {
      OR: [
        { name: { contains: search } },
      ],
    }),

    ...(isActive !== undefined && {
      isActive: isActive === "true" || isActive === true,
    }),
  };

  const total = await prisma.plan.count({ where });

  const data = await prisma.plan.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      [safeSortBy]: order === "asc" ? "asc" : "desc",
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
  return prisma.plan.findUnique({
    where: { id },
  });
};

export const create = (data) => {
  return prisma.plan.create({
    data,
  });
};

export const update = (id, data) => {
  return prisma.plan.update({
    where: { id },
    data,
  });
};

export const remove = (id) => {
  // soft delete (recommended)
  return prisma.plan.update({
    where: { id },
    data: { isActive: false },
  });
};