import { Activity, IActivity } from "../models/Activity";
import mongoose from "mongoose";

export interface CreateActivityData {
  userId: string | mongoose.Types.ObjectId;
  activityType:
    | "swap"
    | "invest"
    | "stake"
    | "withdraw_vault"
    | "withdraw_stake";
  amount: string;
  tokenSymbol?: string;
  fromToken?: string;
  toToken?: string;
  vaultName?: string;
  vaultAddress?: string;
  poolName?: string;
  poolId?: number;
  stakingPoolAddress?: string;
  transactionHash: string;
  status?: "success" | "failed" | "pending";
  metadata?: Record<string, any>;
}

export interface GetActivitiesOptions {
  userId: string | mongoose.Types.ObjectId;
  page?: number;
  limit?: number;
  activityType?:
    | "swap"
    | "invest"
    | "stake"
    | "withdraw_vault"
    | "withdraw_stake";
}

export interface PaginatedActivities {
  activities: IActivity[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

class ActivityService {
  /**
   * Record a new activity
   */
  async createActivity(data: CreateActivityData): Promise<IActivity> {
    try {
      const activity = await Activity.create({
        userId: data.userId,
        activityType: data.activityType,
        amount: data.amount,
        tokenSymbol: data.tokenSymbol,
        fromToken: data.fromToken,
        toToken: data.toToken,
        vaultName: data.vaultName,
        vaultAddress: data.vaultAddress,
        poolName: data.poolName,
        poolId: data.poolId,
        stakingPoolAddress: data.stakingPoolAddress,
        transactionHash: data.transactionHash,
        status: data.status || "success",
        metadata: data.metadata,
      });

      return activity;
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  }

  /**
   * Get activities for a user with pagination
   */
  async getUserActivities(
    options: GetActivitiesOptions
  ): Promise<PaginatedActivities> {
    try {
      const { userId, page = 1, limit = 20, activityType } = options;

      // Build query
      const query: any = { userId };

      if (activityType) {
        query.activityType = activityType;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count
      const totalItems = await Activity.countDocuments(query);

      // Get activities sorted by most recent first
      const activities = await Activity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IActivity[]>();

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalItems / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        activities,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage,
          hasPreviousPage,
        },
      };
    } catch (error) {
      console.error("Error getting user activities:", error);
      throw error;
    }
  }

  /**
   * Get recent activities for a user (last N activities)
   */
  async getRecentActivities(
    userId: string | mongoose.Types.ObjectId,
    limit: number = 10
  ): Promise<IActivity[]> {
    try {
      const activities = await Activity.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean<IActivity[]>();

      return activities;
    } catch (error) {
      console.error("Error getting recent activities:", error);
      throw error;
    }
  }

  /**
   * Get activity by transaction hash
   */
  async getActivityByTransactionHash(
    transactionHash: string
  ): Promise<IActivity | null> {
    try {
      const activity = await Activity.findOne({
        transactionHash,
      }).lean<IActivity>();
      return activity;
    } catch (error) {
      console.error("Error getting activity by transaction hash:", error);
      throw error;
    }
  }

  /**
   * Update activity status
   */
  async updateActivityStatus(
    transactionHash: string,
    status: "success" | "failed" | "pending"
  ): Promise<IActivity | null> {
    try {
      const activity = await Activity.findOneAndUpdate(
        { transactionHash },
        { status },
        { new: true }
      );

      return activity;
    } catch (error) {
      console.error("Error updating activity status:", error);
      throw error;
    }
  }

  /**
   * Get activity statistics for a user
   */
  async getActivityStats(userId: string | mongoose.Types.ObjectId): Promise<{
    totalActivities: number;
    totalSwaps: number;
    totalInvestments: number;
    totalStakes: number;
  }> {
    try {
      const [totalActivities, totalSwaps, totalInvestments, totalStakes] =
        await Promise.all([
          Activity.countDocuments({ userId }),
          Activity.countDocuments({ userId, activityType: "swap" }),
          Activity.countDocuments({ userId, activityType: "invest" }),
          Activity.countDocuments({ userId, activityType: "stake" }),
        ]);

      return {
        totalActivities,
        totalSwaps,
        totalInvestments,
        totalStakes,
      };
    } catch (error) {
      console.error("Error getting activity stats:", error);
      throw error;
    }
  }
}

export const activityService = new ActivityService();
