import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";

export const getUsers = ({
  skip,
  pageSize,
  where,
  sortBy,
  order,
}) => {
  // allowed sort fields (extra safety at service level)
  const allowedSortFields = ["id", "name", "email", "createdAt"];

  const safeSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : "createdAt";

  const safeOrder = order === "asc" ? "asc" : "desc";

  return prisma.user.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: {
      [safeSortBy]: safeOrder,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });
};

export const countUsers = (where) => {
  return prisma.user.count({ where });
};

const sanitizeUserData = (data) => {
  const allowedFields = [
    'name',
    'email',
    'password',
    'role',
    'isActive',
    'isVerified',
    'mobile',
  ];

  const sanitized = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (field === 'password' && data[field] === '') {
        continue;
      }
      sanitized[field] = data[field];
    }
  }

  if (data.status !== undefined) {
    sanitized.isActive = data.status === 'active';
  }

  return sanitized;
};

export const getUserById = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVerified: true,
      isActive: true,
      mobile: true,
    },
  });
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isVerified: true,
  isActive: true,
  mobile: true,
  createdAt: true,
  updatedAt: true,
};

export const createUser = async (data) => {
  const sanitized = sanitizeUserData(data);

  if (!sanitized.password) {
    throw new Error('Password is required');
  }

  sanitized.password = await bcrypt.hash(sanitized.password, 10);

  return prisma.user.create({
    data: sanitized,
    select: userSelect,
  });
};

export const updateUser = async (id, data) => {
  const sanitized = sanitizeUserData(data);

  if (sanitized.password) {
    sanitized.password = await bcrypt.hash(sanitized.password, 10);
  }

  return prisma.user.update({
    where: { id },
    data: sanitized,
    select: userSelect,
  });
};

export const deleteUser = (id) => {
  return prisma.user.delete({
    where: { id },
  });
};