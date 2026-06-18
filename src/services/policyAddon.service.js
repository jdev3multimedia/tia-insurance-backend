import prisma from "../config/prisma.js";

export const getAll = async ({
  page,
  limit,
  search,
  sortBy,
  order,
  isActive,
}) => {

  const skip =
    (page - 1) * limit;

  const allowedSortFields = [
    "id",
    "srNo",
    "addonName",
    "createdAt",
  ];

  const safeSortBy =
    allowedSortFields.includes(sortBy)
      ? sortBy
      : "id";

  const where = {

    ...(search && {
      addonName: {
        contains: search,
      },
    }),

    ...(isActive !== undefined && {
      isActive:
        isActive === "true" ||
        isActive === true,
    }),
  };

  const total =
    await prisma.policyAddons.count({
      where,
    });

  const data =
    await prisma.policyAddons.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [safeSortBy]:
          order === "asc"
            ? "asc"
            : "desc",
      },
    });

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(
        total / limit
      ),
    },
  };
};

export const getById = (id) => {
  return prisma.policyAddons.findUnique({
    where: { id },
  });
};

export const create = (data) => {
  return prisma.policyAddons.create({
    data,
  });
};

export const update = (
  id,
  data
) => {
  return prisma.policyAddons.update({
    where: { id },
    data,
  });
};

export const remove = (id) => {
  return prisma.policyAddons.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
};