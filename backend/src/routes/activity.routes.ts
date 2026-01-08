import { Router } from "express";
import {
  getUserActivities,
  getRecentActivities,
  getActivityByTransaction,
  getActivityStats,
} from "../controllers/activity.controller";
import { protect as authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * @route   GET /api/activity/list
 * @desc    Get user's activities with pagination
 * @query   page, limit, type (optional: swap|invest|stake)
 * @access  Private
 */
router.get("/list", authenticate, getUserActivities);

/**
 * @route   GET /api/activity/recent
 * @desc    Get recent activities (last N activities)
 * @query   limit (optional, default: 10, max: 50)
 * @access  Private
 */
router.get("/recent", authenticate, getRecentActivities);

/**
 * @route   GET /api/activity/stats
 * @desc    Get activity statistics for the user
 * @access  Private
 */
router.get("/stats", authenticate, getActivityStats);

/**
 * @route   GET /api/activity/transaction/:hash
 * @desc    Get activity by transaction hash
 * @access  Private
 */
router.get("/transaction/:hash", authenticate, getActivityByTransaction);

export default router;
