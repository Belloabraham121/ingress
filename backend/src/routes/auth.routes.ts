import express from "express";
import {
  register,
  login,
  getMe,
  fundWallet,
  sendHBAR,
  transferHBAR,
  getWalletBalance,
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", protect, getMe);
router.post("/fund-wallet", protect, fundWallet);
router.post("/send-hbar", protect, sendHBAR);
router.post("/transfer-hbar", protect, transferHBAR);
router.get("/wallet-balance", protect, getWalletBalance);

export default router;
