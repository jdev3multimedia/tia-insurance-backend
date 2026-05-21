import * as service from "../services/occupancy.service.js";

export const getAllOccupancy = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const rawLimit = Number(req.query.limit) || 10;
    const limit = Math.min(rawLimit, 100);

    const {
      search = "",
      sortBy = "id",
      order = "desc",
      category,
    } = req.query;

    const data = await service.getAll({
      page,
      limit,
      search,
      sortBy,
      order,
      category,
    });

    res.json({
      success: true,
      ...data,
      meta: {
        limitUsed: limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getOccupancyById = async (req, res) => {
  try {
    const data = await service.getById(Number(req.params.id));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOccupancy = async (req, res) => {
  try {
    const data = await service.create(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOccupancy = async (req, res) => {
  try {
    const data = await service.update(Number(req.params.id), req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteOccupancy = async (req, res) => {
  try {
    await service.remove(Number(req.params.id));
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// controller (occupancy.controller.js)


export const searchOccupancy = async (req, res) => {
  try {
    const query = req.query.query?.trim() || "";

    if (!query) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const data = await service.searchOccupancy(query);

    res.json({
      success: true,
      data,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};