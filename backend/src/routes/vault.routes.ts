import { Router } from "express";
import {
  signApprove,
  signDeposit,
  signWithdraw,
  getAllowance,
  getUserBalance,
} from "../controllers/vault.controller";
import { protect as authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * @route   POST /api/vault/sign-approve
 * @desc    Sign an ERC20 approve transaction for vault deposit
 * @access  Private
 */
router.post("/sign-approve", authenticate, signApprove);

/**
 * @route   POST /api/vault/sign-deposit
 * @desc    Sign a vault deposit transaction
 * @access  Private
 */
router.post("/sign-deposit", authenticate, signDeposit);

/**
 * @route   POST /api/vault/sign-withdraw
 * @desc    Sign a vault withdrawal transaction
 * @access  Private
 */
router.post("/sign-withdraw", authenticate, signWithdraw);

/**
 * @route   GET /api/vault/allowance
 * @desc    Get token allowance for a spender
 * @access  Private
 */
router.get("/allowance", authenticate, getAllowance);

/**
 * @route   GET /api/vault/user-balance
 * @desc    Get user's balance in a vault
 * @access  Private
 */
router.get("/user-balance", authenticate, getUserBalance);

export default router;
