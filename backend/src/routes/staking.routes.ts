import { Router } from "express";
import {
  signApprove,
  signStake,
  getAllowance,
} from "../controllers/staking.controller";
import { protect as authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * @route   POST /api/staking/sign-approve
 * @desc    Sign an ERC20 approve transaction for staking
 * @access  Private (requires JWT)
 */
router.post("/sign-approve", authenticate, signApprove);

/**
 * @route   POST /api/staking/sign-stake
 * @desc    Sign a stake transaction
 * @access  Private (requires JWT)
 */
router.post("/sign-stake", authenticate, signStake);

/**
 * @route   GET /api/staking/allowance
 * @desc    Get token allowance for staking pool
 * @access  Private (requires JWT)
 */
router.get("/allowance", authenticate, getAllowance);

export default router;
