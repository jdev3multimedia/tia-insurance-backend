import express from "express";

import {
  exportQuotationPdf,
  exportQuotationExcel,
} from "../controllers/quotation.export.controller.js";

import { protect, authorize } from "../middleware/auth.middleware.js";


const router = express.Router();

/**
 * =====================================
 * PROTECTED EXPORT ROUTES (QUOTATION)
 * =====================================
 */
router.use(protect);

/**
 * EXPORT PDF
 * GET /api/quotations/:id/export/pdf
 */

router.get(
  "/:id/export/pdf",
  authorize("ADMIN", "SUPER_ADMIN", "EMPLOYEE", "AGENT"),
  exportQuotationPdf
);

/**
 * EXPORT EXCEL
 * GET /api/quotations/:id/export/excel
 */
router.get(
  "/:id/export/excel",
  authorize("ADMIN", "SUPER_ADMIN", "EMPLOYEE", "AGENT"),
  exportQuotationExcel
);

export default router;