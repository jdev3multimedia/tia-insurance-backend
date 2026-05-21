import prisma from "../config/prisma.js";

export const getAll = async ({
  page,
  limit,
  search,
  sortBy,
  order,
  state,
  zone,
}) => {
  const skip = (page - 1) * limit;

  // safe sort fields
  const allowedSortFields = [
    "id",
    "pincode",
    "district_name",
    "dwelling_rate",
    "created_at",
  ];

  const safeSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : "id";

  // filters
  const where = {
    ...(search && {
      OR: [
        { pincode: { contains: search } },
        { district_name: { contains: search } },
        { mapped_district_name: { contains: search } },
      ],
    }),

    ...(state && { state_name: state }),
    ...(zone && { zone_code: zone }),
  };

  const total = await prisma.locationRateMaster.count({ where });

  const data = await prisma.locationRateMaster.findMany({
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
  return prisma.locationRateMaster.findUnique({
    where: { id },
  });
};

export const create = (data) => {
  return prisma.locationRateMaster.create({
    data,
  });
};

export const update = (id, data) => {
  return prisma.locationRateMaster.update({
    where: { id },
    data,
  });
};

export const remove = (id) => {
  return prisma.locationRateMaster.delete({
    where: { id },
  });
};