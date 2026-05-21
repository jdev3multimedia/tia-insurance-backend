import * as service from "../services/plan.service.js";

export const getAllPlans = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const rawLimit = Number(req.query.limit) || 10;
    const limit = Math.min(rawLimit, 100);

    const {
      search = "",
      sortBy = "id",
      order = "desc",
      isActive,
    } = req.query;

    const result = await service.getAll({
      page,
      limit,
      search,
      sortBy,
      order,
      isActive,
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

export const getPlanById = async (req, res) => {
  try {
    const data = await service.getById(Number(req.params.id));

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createPlan = async (req, res) => {
  try {
    const data = await service.create(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const data = await service.update(Number(req.params.id), req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePlan = async (req, res) => {
  try {
    await service.remove(Number(req.params.id));
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};