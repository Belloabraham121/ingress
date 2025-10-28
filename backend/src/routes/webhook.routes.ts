import express from "express";
import {
  handlePaystackWebhook,
  getTransactionHistory,
} from "../controllers/webhook.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

// Webhook endpoint (no authentication - Paystack calls this)
router.post("/paystack", handlePaystackWebhook);

// Transaction history (protected)
router.get("/transactions", protect, getTransactionHistory);

export default router;
