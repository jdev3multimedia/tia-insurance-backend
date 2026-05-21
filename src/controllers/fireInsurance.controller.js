import { calculateFireInsurancePremium } from "../services/fireInsurance.service.js";

export const calculateFireInsurance = async (req, res) => {
  try {
    const result = await calculateFireInsurancePremium(req.body);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};