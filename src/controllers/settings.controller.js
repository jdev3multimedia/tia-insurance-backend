import * as settingsService from "../services/settings.service.js";

export const getSettings = async (req, res) => {
  try {
    const data = await settingsService.getSettings();

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { appConfig, roleConfig } = req.body;

    await settingsService.updateSettings(appConfig, roleConfig);

    return res.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};