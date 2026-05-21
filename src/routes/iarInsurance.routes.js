import express from "express";
import { calculateIARInsurance } from "../controllers/iarInsurance.controller.js";

const router = express.Router();

router.post("/calculate", calculateIARInsurance);

export default router;