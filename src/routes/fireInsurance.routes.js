import express from "express";
import { calculateFireInsurance } from "../controllers/fireInsurance.controller.js";

const router = express.Router();

router.post("/calculate", calculateFireInsurance);

export default router;