import prisma from "../config/prisma.js";

export const getAll = async ({
  page,
  limit,
  search,
  sortBy,
  order,
  category,
}) => {
  const skip = (page - 1) * limit;

  // 🔍 WHERE FILTER
  const where = {
    ...(search && {
      OR: [
        { risk_code: { contains: search } },
        { occupancy_desc: { contains: search } },
      ],
    }),

    ...(category && {
      occupancy_category: category,
    }),
  };

  // 🔢 TOTAL COUNT
  const total = await prisma.occupancyRateMaster.count({ where });

  // 📊 DATA FETCH
  const data = await prisma.occupancyRateMaster.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: order,
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
  return prisma.occupancyRateMaster.findUnique({
    where: { id },
  });
};

export const create = (data) => {
  return prisma.occupancyRateMaster.create({
    data,
  });
};

export const update = (id, data) => {
  return prisma.occupancyRateMaster.update({
    where: { id },
    data,
  });
};

export const remove = (id) => {
  return prisma.occupancyRateMaster.delete({
    where: { id },
  });
};


// service (occupancy.service.js)
export const searchOccupancy = async (query) => {
  return prisma.occupancyRateMaster.findMany({
    where: {
      OR: [
        {
          risk_code: {
            contains: query,
          },
        },
        {
          occupancy_desc: {
            contains: query,
          },
        },
      ],
    },

    take: 5,

    select: {
      id: true,
      risk_code: true,
      occupancy_desc: true,
      occupancy_category: true,
    },

    orderBy: {
      occupancy_desc: "asc",
    },
  });
};