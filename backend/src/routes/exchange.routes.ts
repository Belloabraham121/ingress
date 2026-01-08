import { Router } from "express";
import {
  signApprove,
  signDepositToken,
  signSwap,
  getExchangeBalance,
  getExchangeRates,
  calculateSwapOutput,
  initiateNairaToTokenPayment,
  swapTokenToToken,
  cashoutTokenToNaira,
  spendNairaForExchange,
  swapHbarToToken,
  cashoutHbarToNaira,
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

/**
 * @route   GET /api/exchange/rates
 * @desc    Get exchange rates for all tokens
 * @access  Private
 */
router.get("/rates", authenticate, getExchangeRates);

/**
 * @route   POST /api/exchange/calculate
 * @desc    Calculate expected output for a swap
 * @access  Private
 */
router.post("/calculate", authenticate, calculateSwapOutput);

/**
 * @route   POST /api/exchange/initiate-payment
 * @desc    Initiate Naira to Token/HBAR payment
 * @access  Private
 */
router.post("/initiate-payment", authenticate, initiateNairaToTokenPayment);

/**
 * @route   POST /api/exchange/swap-token-token
 * @desc    Direct token-to-token swap using exchange liquidity
 * @access  Private
 */
router.post("/swap-token-token", authenticate, swapTokenToToken);
router.post("/swap-hbar-token", authenticate, swapHbarToToken);

/**
 * @route   POST /api/exchange/cashout-token
 * @desc    Cash out token to Naira immediately after deposit
 * @access  Private
 */
router.post("/cashout-token", authenticate, cashoutTokenToNaira);
router.post("/cashout-hbar", authenticate, cashoutHbarToNaira);

/**
 * @route   POST /api/exchange/spend-naira
 * @desc    Spend NGN balance to buy Token/HBAR (no Paystack)
 * @access  Private
 */
router.post("/spend-naira", authenticate, spendNairaForExchange);

export default router;
