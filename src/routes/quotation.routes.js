import express from "express";
import {
  getAllQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  deleteQuote,
} from "../controllers/quotation.controller.js";

import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// Read permissions
router
  .route("/")
  .get(
    authorize(
      "ADMIN",
      "SUPER_ADMIN",
      "EMPLOYEE",
      "AGENT",
      "CUSTOMER"
    ),
    getAllQuotes
  )
  .post(
    authorize("ADMIN", "SUPER_ADMIN"),
    createQuote
  );

router
  .route("/:id")
  .get(
    authorize(
      "ADMIN",
      "SUPER_ADMIN",
      "EMPLOYEE",
      "AGENT",
      "CUSTOMER"
    ),
    getQuoteById
  )
  .put(
    authorize("ADMIN", "SUPER_ADMIN"),
    updateQuote
  )
  .delete(
    authorize("ADMIN", "SUPER_ADMIN"),
    deleteQuote
  );


export default router;