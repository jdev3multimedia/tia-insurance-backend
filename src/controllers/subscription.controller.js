import * as service from "../services/subscription.service.js";

export const getAllSubscriptions = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const rawLimit = Number(req.query.limit) || 10;
    const limit = Math.min(rawLimit, 100);

    const {
      search = "",
      sortBy = "id",
      order = "desc",
      status,
      userId,
      planId,
    } = req.query;

    const result = await service.getAll({
      page,
      limit,
      search,
      sortBy,
      order,
      status,
      userId,
      planId,
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

export const getSubscriptionById = async (req, res) => {
  try {
    const data = await service.getById(Number(req.params.id));

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
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

export const subscribe = async (req, res) => {
  try {
    const data = await service.createSubscription(
      req.user.id,
      req.body.planId
    );

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const data = await service.update(
      Number(req.params.id),
      req.body
    );

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteSubscription = async (req, res) => {
  try {
    await service.remove(Number(req.params.id));

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};