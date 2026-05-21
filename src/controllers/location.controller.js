import * as service from "../services/location.service.js";

export const getAllLocation = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const rawLimit = Number(req.query.limit) || 10;
    const limit = Math.min(rawLimit, 100);

    const {
      search = "",
      sortBy = "id",
      order = "desc",
      state,
      zone,
    } = req.query;

    const result = await service.getAll({
      page,
      limit,
      search,
      sortBy,
      order,
      state,
      zone,
    });

    res.json({
      success: true,
      ...result,
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

export const getLocationById = async (req, res) => {
  try {
    const data = await service.getById(Number(req.params.id));
    if (!data) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createLocation = async (req, res) => {
  try {
    const data = await service.create(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const data = await service.update(Number(req.params.id), req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLocation = async (req, res) => {
  try {
    await service.remove(Number(req.params.id));
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};