import { useState, useCallback } from "react";
import {
  Activity,
  PaginatedActivities,
  ActivityStats,
  ApiResponse,
} from "@/types/api";
import { api } from "@/lib/api";

export const useActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<
    PaginatedActivities["pagination"] | null
  >(null);

  /**
   * Get user's activities with pagination
   */
  const getActivities = useCallback(
    async (
      page: number = 1,
      limit: number = 20,
      type?: "swap" | "invest" | "stake"
    ): Promise<PaginatedActivities | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (type) {
          params.append("type", type);
        }

        // Use a custom fetch to handle pagination in response
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
          }/api/activity/list?${params}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              "Content-Type": "application/json",
            },
          }
        );

        const result: ApiResponse<Activity[]> & {
          pagination?: PaginatedActivities["pagination"];
        } = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch activities");
        }

        if (result.data) {
          setActivities(result.data);
        }

        if (result.pagination) {
          setPagination(result.pagination);
        }

        return {
          activities: result.data || [],
          pagination: result.pagination || {
            currentPage: page,
            totalPages: 1,
            totalItems: result.data?.length || 0,
            itemsPerPage: limit,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      } catch (err: any) {
        const errorMessage = err.message || "Failed to fetch activities";
        setError(errorMessage);
        console.error("Error fetching activities:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get recent activities (last N activities)
   */
  const getRecentActivities = useCallback(
    async (limit: number = 10): Promise<Activity[] | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.get<Activity[]>(
          `/api/activity/recent?limit=${limit}`
        );

        if (result) {
          setActivities(result);
        }

        return result || [];
      } catch (err: any) {
        const errorMessage = err.message || "Failed to fetch recent activities";
        setError(errorMessage);
        console.error("Error fetching recent activities:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get activity by transaction hash
   */
  const getActivityByTransaction = useCallback(
    async (transactionHash: string): Promise<Activity | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.get<Activity>(
          `/api/activity/transaction/${transactionHash}`
        );

        return result || null;
      } catch (err: any) {
        const errorMessage = err.message || "Failed to fetch activity";
        setError(errorMessage);
        console.error("Error fetching activity:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get activity statistics
   */
  const getActivityStats =
    useCallback(async (): Promise<ActivityStats | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.get<ActivityStats>(`/api/activity/stats`);

        return result || null;
      } catch (err: any) {
        const errorMessage =
          err.message || "Failed to fetch activity statistics";
        setError(errorMessage);
        console.error("Error fetching activity stats:", err);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);

  return {
    activities,
    loading,
    error,
    pagination,
    getActivities,
    getRecentActivities,
    getActivityByTransaction,
    getActivityStats,
  };
};
