import { calculateIARInsurancePremium } from "../services/iarInsurance.service.js";

export const calculateIARInsurance = async (req, res) => {
  try {

    const result =
      await calculateIARInsurancePremium(req.body);

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