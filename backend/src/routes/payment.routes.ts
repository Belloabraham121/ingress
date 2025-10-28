import express from "express";
import {
  initializePayment,
  verifyPayment,
  getPaymentHistory,
} from "../controllers/payment.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

// All routes are protected (require authentication)
router.post("/initialize", protect, initializePayment);
router.get("/verify/:reference", protect, verifyPayment);
router.get("/history", protect, getPaymentHistory);

export default router;
