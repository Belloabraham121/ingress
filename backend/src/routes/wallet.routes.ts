import { Router } from "express";
import { protect as authenticate } from "../middleware/auth.middleware";
import { resolveAccountId } from "../controllers/wallet.controller";

const router = Router();

/**
 * @route   GET /api/wallet/resolve/:accountId
 * @desc    Resolve an account ID to user's display name
 * @access  Private
 */
router.get("/resolve/:accountId", authenticate, resolveAccountId);

export default router;
