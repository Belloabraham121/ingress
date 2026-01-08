import express from "express";
import {
  register,
  login,
  getMe,
  fundWallet,
  sendHBAR,
  transferHBAR,
  getWalletBalance,
  transferToken,
  logout,
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
router.post("/transfer-token", protect, transferToken);
router.get("/wallet-balance", protect, getWalletBalance);
router.post("/logout", protect, logout);

export default router;
