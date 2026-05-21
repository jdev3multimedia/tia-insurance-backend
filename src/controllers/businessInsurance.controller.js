import { calculateBusinessInsurancePremium } from "../services/businessInsurance.service.js";

export const calculateBusinessInsurance = async (req, res) => {
  try {

    const result =
      await calculateBusinessInsurancePremium(req.body);

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message
    });

  }
};