import * as userService from "../services/user.service.js";

export const getUsers = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const rawLimit = Number(req.query.limit) || 10;
    const limit = Math.min(rawLimit, 100);

    const {
      role,
      search = "",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const skip = (page - 1) * limit;

    // allowed sort fields
    const allowedSortFields = ["id", "name", "email", "createdAt"];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const where = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      userService.getUsers({
        skip,
        pageSize: limit,
        where,
        sortBy: safeSortBy,
        order: order === "asc" ? "asc" : "desc",
      }),
      userService.countUsers(where),
    ]);

    return res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      meta: {
        limitUsed: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getUserById = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (req.user.role !== "ADMIN" && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createUser = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can create users',
      });
    }

    const newUser = await userService.createUser(req.body);

    return res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (req.user.role !== "ADMIN" && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (req.body.role && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "You cannot change role",
      });
    }

    const updatedUser = await userService.updateUser(userId, req.body);

    return res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const currentUserId = Number(req.user.id);

    if (currentUserId === userId) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admin or super admin can delete users",
      });
    }

    await userService.deleteUser(userId);

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};