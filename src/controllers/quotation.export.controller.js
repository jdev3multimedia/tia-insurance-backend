import {
  generateQuotationPdf,
  generateQuotationExcel,
} from "../services/quotation.export.service.js";

/**
 * =========================
 * EXPORT PDF CONTROLLER
 * =========================
 */
export const exportQuotationPdf = async (req, res, next) => {
  try {

    //console.log("Exporting quotation PDF with ID:", req.params.id);
    const { id } = req.params;

    const pdfBuffer = await generateQuotationPdf(id);

    if (!pdfBuffer) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=quotation_${id}.pdf`
    );

    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * =========================
 * EXPORT EXCEL CONTROLLER
 * =========================
 */
export const exportQuotationExcel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const excelBuffer = await generateQuotationExcel(id);

    if (!excelBuffer) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=quotation_${id}.xlsx`
    );

    return res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};