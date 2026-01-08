"use client";

import { useEffect, useState } from "react";
import { useActivity } from "@/hooks/useActivity";
import { SUPPORTED_TOKENS } from "@/lib/hedera-utils";
import { Activity } from "@/types/api";
import { ExternalLink, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ethers } from "ethers";

interface RecentActivityCardProps {
  activityType?: "swap" | "invest" | "stake";
  limit?: number;
}

export function RecentActivityCard({
  activityType,
  limit = 5,
}: RecentActivityCardProps) {
  const { activities, loading, error, getRecentActivities, getActivities } =
    useActivity();
  const [displayActivities, setDisplayActivities] = useState<Activity[]>([]);

  useEffect(() => {
    loadActivities();
  }, [activityType]);

  // Listen for activity updates (triggered after successful transactions)
  useEffect(() => {
    const handleActivityUpdate = () => {
      loadActivities();
    };

    window.addEventListener("activityUpdated", handleActivityUpdate);

    return () => {
      window.removeEventListener("activityUpdated", handleActivityUpdate);
    };
  }, [activityType]);

  const loadActivities = async () => {
    if (activityType) {
      // Get filtered activities by type
      const result = await getActivities(1, limit, activityType);
      if (result?.activities) {
        setDisplayActivities(result.activities);
      }
    } else {
      // Get all recent activities
      const result = await getRecentActivities(limit);
      if (result) {
        setDisplayActivities(result);
      }
    }
  };

  const formatAmount = (amount: string): string => {
    try {
      const isBigIntLike = /^[0-9]+$/.test(amount) && amount.length > 18;
      const num = isBigIntLike
        ? parseFloat(ethers.formatUnits(amount, 18))
        : parseFloat(amount);
      if (isNaN(num)) return amount;
      return num.toLocaleString("en-US", {
        maximumFractionDigits: 6,
        minimumFractionDigits: 0,
      });
    } catch (err) {
      return amount;
    }
  };

  const addressToSymbol: Record<string, string> = Object.values(
    SUPPORTED_TOKENS
  ).reduce((acc, t) => {
    acc[t.address.toLowerCase()] = t.symbol;
    return acc;
  }, {} as Record<string, string>);

  const resolveTokenLabel = (token: string | undefined): string => {
    if (!token) return "tokens";
    const t = token.trim();
    if (t.toUpperCase() === "NGN") return "NGN";
    if (t.toUpperCase() === "HBAR") return "HBAR";
    if (t.startsWith("0x")) {
      return addressToSymbol[t.toLowerCase()] || t;
    }
    return t;
  };

  const getActivityDescription = (activity: Activity): string => {
    const formattedAmount = formatAmount(activity.amount);

    switch (activity.activityType) {
      case "invest":
        return `Deposited ${formattedAmount} ${
          activity.tokenSymbol || "tokens"
        } to ${activity.vaultName || "Vault"}`;
      case "stake":
        return `Staked ${formattedAmount} ${
          activity.tokenSymbol || "tokens"
        } to ${activity.poolName || "Pool"}`;
      case "withdraw_vault":
        return `Withdrew ${formattedAmount} ${
          activity.tokenSymbol || "tokens"
        } from ${activity.vaultName || "Vault"}`;
      case "withdraw_stake":
        return `Unstaked ${formattedAmount} ${
          activity.tokenSymbol || "tokens"
        } from ${activity.poolName || "Pool"}`;
      case "swap":
        if (activity.metadata?.direction === "token_transfer") {
          return `Sent ${formattedAmount} ${resolveTokenLabel(
            activity.fromToken
          )} to ${activity.metadata?.to || "recipient"}`;
        }
        return `Swapped ${formattedAmount} ${resolveTokenLabel(
          activity.fromToken
        )} for ${resolveTokenLabel(activity.toToken)}`;
      default:
        return `Transaction: ${formattedAmount} ${
          activity.tokenSymbol || "tokens"
        }`;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "success":
        return "text-green-500";
      case "failed":
        return "text-red-500";
      case "pending":
        return "text-yellow-500";
      default:
        return "text-foreground/60";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "success":
        return "Completed";
      case "failed":
        return "Failed";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  const getActivityTypeLabel = (type: string): string => {
    switch (type) {
      case "swap":
        return "SWAP";
      case "invest":
        return "INVEST";
      case "stake":
        return "STAKE";
      case "withdraw_vault":
        return "WITHDRAW";
      case "withdraw_stake":
        return "UNSTAKE";
      default:
        return type.toUpperCase();
    }
  };

  const formatTime = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (err) {
      return "Recently";
    }
  };

  const getHashScanUrl = (txHash: string): string => {
    return `https://hashscan.io/testnet/transaction/${txHash}`;
  };

  const getTitle = (): string => {
    if (activityType) {
      return `RECENT ${getActivityTypeLabel(activityType)} ACTIVITY`;
    }
    return "RECENT ACTIVITY";
  };

  if (loading && displayActivities.length === 0) {
    return (
      <div className="mt-12 border border-border bg-background p-6">
        <h2 className="text-lg font-sentient mb-6">{getTitle()}</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 border border-border bg-background p-6">
        <h2 className="text-lg font-sentient mb-6">{getTitle()}</h2>
        <div className="text-center py-8">
          <p className="text-sm font-mono text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 border border-border bg-background p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-sentient">{getTitle()}</h2>
        {displayActivities.length > 0 && (
          <span className="text-xs font-mono text-foreground/50">
            {displayActivities.length}{" "}
            {displayActivities.length === 1 ? "transaction" : "transactions"}
          </span>
        )}
      </div>

      {displayActivities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm font-mono text-foreground/60">
            No {activityType ? activityType : ""} activities yet
          </p>
          <p className="text-xs font-mono text-foreground/40 mt-2">
            Your transactions will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayActivities.map((activity) => (
            <div
              key={activity._id}
              className="flex justify-between items-center py-3 border-b border-border/50 last:border-0 hover:bg-foreground/5 transition-colors px-2 -mx-2"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-primary/80 border border-primary/30 px-2 py-0.5">
                    {getActivityTypeLabel(activity.activityType)}
                  </span>
                </div>
                <p className="text-sm font-mono text-foreground">
                  {getActivityDescription(activity)}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs font-mono text-foreground/50">
                    {formatTime(activity.createdAt)}
                  </p>
                  <a
                    href={getHashScanUrl(activity.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-primary/70 hover:text-primary flex items-center gap-1"
                  >
                    View on HashScan
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <span
                className={`text-xs font-mono ${getStatusColor(
                  activity.status
                )} whitespace-nowrap ml-4`}
              >
                {getStatusText(activity.status)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
