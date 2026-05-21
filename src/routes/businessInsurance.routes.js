import express from "express";
import { calculateBusinessInsurance } from "../controllers/businessInsurance.controller.js";

const router = express.Router();

router.post("/calculate", calculateBusinessInsurance);

export default router;