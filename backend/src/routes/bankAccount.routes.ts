import express from "express";
import {
  createBankAccount,
  getBankAccountDetails,
  getAccountBalance,
  getAvailableBanks,
  refreshBalance,
  transferNaira,
} from "../controllers/bankAccount.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

// All routes are protected (require authentication)
router.post("/create", protect, createBankAccount);
router.get("/details", protect, getBankAccountDetails);
router.get("/balance", protect, getAccountBalance);
router.get("/banks", protect, getAvailableBanks);
router.post("/refresh-balance", protect, refreshBalance);
router.post("/transfer", protect, transferNaira);

export default router;
