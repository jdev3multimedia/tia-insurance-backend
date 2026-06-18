import * as quotationService from "../services/quotation.service.js";

/**
 * GET /quotes
 */
// export const getAllQuotes = async (req, res, next) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       search = "",
//       sortBy = "id",
//       order = "desc",
//     } = req.query;

//     const result = await quotationService.getAll({
//       page: Number(page),
//       limit: Number(limit),
//       search,
//       sortBy,
//       order,
//     });

//     res.status(200).json({
//       success: true,
//       ...result,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const getAllQuotes = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "id",
      order = "desc",
      quoteType, // 
    } = req.query;

    const result = await quotationService.getAll({
      page: Number(page),
      limit: Number(limit),
      search,
      sortBy,
      order,
      quoteType, // 
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /quotes/:id
 */
export const getQuoteById = async (req, res, next) => {
  try {
    const quote = await quotationService.getById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /quotes
 */
export const createQuote = async (req, res, next) => {
  try {
    const quote = await quotationService.create(req.body);

    res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      data: quote,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /quotes/:id
 */
export const updateQuote = async (req, res, next) => {
  try {
    const result = await quotationService.update(
      req.params.id,
      req.body
    );

    if (result.count === 0) {
      return res.status(400).json({
        success: false,
        message: "Quotation not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Quotation updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /quotes/:id
 */
export const deleteQuote = async (req, res, next) => {
  try {
    const result = await quotationService.remove(req.params.id);

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Quotation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

