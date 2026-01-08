import { Request, Response } from "express";
import { activityService } from "../services/activity.service";

/**
 * Get user's activities with pagination
 * GET /api/activity/list
 */
export const getUserActivities = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    // Extract query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const activityType = req.query.type as
      | "swap"
      | "invest"
      | "stake"
      | undefined;

    // Validate page and limit
    if (page < 1) {
      res.status(400).json({
        success: false,
        message: "Page must be greater than 0",
      });
      return;
    }

    if (limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 100",
      });
      return;
    }

    // Validate activity type if provided
    if (activityType && !["swap", "invest", "stake"].includes(activityType)) {
      res.status(400).json({
        success: false,
        message: "Invalid activity type. Must be 'swap', 'invest', or 'stake'",
      });
      return;
    }

    // Get activities
    const result = await activityService.getUserActivities({
      userId,
      page,
      limit,
      activityType,
    });

    res.status(200).json({
      success: true,
      message: "Activities retrieved successfully",
      data: result.activities,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("Error getting user activities:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get activities",
    });
  }
};

/**
 * Get recent activities (last 10 by default)
 * GET /api/activity/recent
 */
export const getRecentActivities = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 10;

    // Validate limit
    if (limit < 1 || limit > 50) {
      res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 50",
      });
      return;
    }

    const activities = await activityService.getRecentActivities(userId, limit);

    res.status(200).json({
      success: true,
      message: "Recent activities retrieved successfully",
      data: activities,
    });
  } catch (error: any) {
    console.error("Error getting recent activities:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get recent activities",
    });
  }
};

/**
 * Get activity by transaction hash
 * GET /api/activity/transaction/:hash
 */
export const getActivityByTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const { hash } = req.params;

    if (!hash) {
      res.status(400).json({
        success: false,
        message: "Transaction hash is required",
      });
      return;
    }

    const activity = await activityService.getActivityByTransactionHash(hash);

    if (!activity) {
      res.status(404).json({
        success: false,
        message: "Activity not found",
      });
      return;
    }

    // Verify the activity belongs to the requesting user
    if (activity.userId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: "Forbidden: You don't have access to this activity",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Activity retrieved successfully",
      data: activity,
    });
  } catch (error: any) {
    console.error("Error getting activity by transaction:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get activity",
    });
  }
};

/**
 * Get activity statistics
 * GET /api/activity/stats
 */
export const getActivityStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const stats = await activityService.getActivityStats(userId);

    res.status(200).json({
      success: true,
      message: "Activity statistics retrieved successfully",
      data: stats,
    });
  } catch (error: any) {
    console.error("Error getting activity stats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get activity statistics",
    });
  }
};
