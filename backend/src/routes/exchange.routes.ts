import { Router } from "express";
import {
  signApprove,
  signDepositToken,
  signSwap,
  getExchangeBalance,
} from "../controllers/exchange.controller";
import { protect as authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * @route   POST /api/exchange/sign-approve
 * @desc    Sign an ERC20 approve transaction for exchange
 * @access  Private
 */
router.post("/sign-approve", authenticate, signApprove);

/**
 * @route   POST /api/exchange/sign-deposit
 * @desc    Deposit tokens to exchange
 * @access  Private
 */
router.post("/sign-deposit", authenticate, signDepositToken);

/**
 * @route   POST /api/exchange/sign-swap
 * @desc    Execute a token swap
 * @access  Private
 */
router.post("/sign-swap", authenticate, signSwap);

/**
 * @route   GET /api/exchange/balance
 * @desc    Get user's token balance in exchange
 * @query   exchangeAddress, tokenAddress
 * @access  Private
 */
router.get("/balance", authenticate, getExchangeBalance);

export default router;
