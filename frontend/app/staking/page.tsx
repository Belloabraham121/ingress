"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Logo } from "@/components/logo";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
} from "recharts";
import {
  ChartSkeleton,
  TableSkeleton,
  SummaryCardsSkeleton,
} from "@/components/chart-skeleton";
import { useUserStakingPositions } from "@/hooks/useUserStakingPositions";
import { useAuth } from "@/hooks/useAuth";
import { getEvmAddressFromAccountId } from "@/lib/hedera-utils";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StakingPage() {
  const { getProfile } = useAuth();
  const [userEvmAddress, setUserEvmAddress] = useState<string | undefined>();
  const { positions, summary, isLoading, error, refresh } =
    useUserStakingPositions(userEvmAddress);

  useEffect(() => {
    loadUserAddress();
  }, []);

  const loadUserAddress = async () => {
    try {
      const profile = await getProfile();
      if (profile?.wallet?.accountId) {
        // Get EVM address from Hedera account ID via mirror node
        const evmAddress = await getEvmAddressFromAccountId(
          profile.wallet.accountId
        );
        setUserEvmAddress(evmAddress);
      }
    } catch (err) {
      console.error("Failed to load user EVM address:", err);
    }
  };

  const formatNumber = (value: string, decimals: number = 2): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate totals from blockchain data
  const totalStaked = parseFloat(summary?.totalStaked || "0");
  const totalRewards = parseFloat(summary?.totalPendingRewards || "0");
  const dailyRewards = parseFloat(summary?.totalDailyRewards || "0");

  // Generate performance data for chart
  const stakingPerformanceData = useMemo(() => {
    if (positions.length === 0) {
      return [{ month: "Now", rewards: 0, totalStaked: 0 }];
    }

    // Find earliest stake date
    const earliestStake = positions.reduce((earliest, pos) => {
      return pos.stakeTime < earliest ? pos.stakeTime : earliest;
    }, positions[0]?.stakeTime || new Date());

    const now = new Date();
    const daysSinceStake = Math.floor(
      (now.getTime() - earliestStake.getTime()) / (1000 * 60 * 60 * 24)
    );

    const currentStaked = parseFloat(summary?.totalStaked || "0");
    const currentRewards = positions.reduce(
      (sum, pos) => sum + parseFloat(pos.totalRewards),
      0
    );
    const dailyReward = parseFloat(summary?.totalDailyRewards || "0");

    const formatDateLabel = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };

    const futureDate = (days: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() + days);
      return formatDateLabel(date);
    };

    const estimateRewards = (daysFromNow: number) => {
      return currentRewards + dailyReward * daysFromNow;
    };

    return [
      {
        month: formatDateLabel(earliestStake),
        rewards: 0,
        totalStaked: currentStaked,
      },
      {
        month: "Now",
        rewards: currentRewards,
        totalStaked: currentStaked,
      },
      {
        month: futureDate(30),
        rewards: estimateRewards(30),
        totalStaked: currentStaked,
      },
      {
        month: futureDate(90),
        rewards: estimateRewards(90),
        totalStaked: currentStaked,
      },
      {
        month: futureDate(180),
        rewards: estimateRewards(180),
        totalStaked: currentStaked,
      },
      {
        month: futureDate(365),
        rewards: estimateRewards(365),
        totalStaked: currentStaked,
      },
    ];
  }, [positions, summary]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 md:px-8 lg:px-12 py-6 flex justify-between items-center">
        <Link href="/dashboard">
          <Logo className="w-[100px] md:w-[120px]" />
        </Link>
        <Link href="/dashboard">
          <button className="px-6 py-3 border border-border bg-background text-foreground font-mono text-sm font-medium transition-all duration-300 hover:border-primary hover:bg-primary/10">
            [Back to Dashboard]
          </button>
        </Link>
      </div>

      <main className="pt-12 pb-16">
        <div className="container">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-sentient mb-4">
              Staking <i className="font-light">Activities</i>
            </h1>
            <p className="font-mono text-sm text-foreground/60 max-w-[500px]">
              Monitor your staking positions, track daily rewards, and manage
              your passive income streams
            </p>
          </div>

          {/* Summary Cards */}
          {isLoading ? (
            <SummaryCardsSkeleton count={4} className="mb-12" />
          ) : error ? (
            <Alert variant="destructive" className="mb-12">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-mono text-sm">
                {error}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">
                  TOTAL STAKED
                </p>
                <p className="text-2xl font-sentient text-primary">
                  {formatNumber(summary?.totalStaked || "0", 2)}{" "}
                  {positions[0]?.symbol || ""}
                </p>
              </div>
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">
                  TOTAL REWARDS EARNED
                </p>
                <p className="text-2xl font-sentient text-green-500">
                  +{formatNumber(summary?.totalPendingRewards || "0", 2)}{" "}
                  {positions[0]?.symbol || ""}
                </p>
              </div>
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">
                  DAILY REWARDS
                </p>
                <p className="text-2xl font-sentient text-primary">
                  +{formatNumber(summary?.totalDailyRewards || "0", 4)}{" "}
                  {positions[0]?.symbol || ""}
                </p>
              </div>
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">
                  ACTIVE POSITIONS
                </p>
                <p className="text-2xl font-sentient text-primary">
                  {positions.length}
                </p>
              </div>
            </div>
          )}

          {/* Rewards Chart */}
          <div className="border border-border bg-background p-6 mb-12">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-lg font-sentient">
                STAKING REWARDS OVER TIME
              </h2>
              {!isLoading && !error && (
                <button
                  onClick={refresh}
                  className="p-2 hover:bg-foreground/5 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4 text-foreground/60" />
                </button>
              )}
            </div>
            {isLoading ? (
              <ChartSkeleton height="h-[400px]" showLegend={true} />
            ) : positions.length === 0 ? (
              <div className="h-[400px] flex items-center justify-center border border-border/50">
                <div className="text-center space-y-2">
                  <p className="text-sm font-mono text-foreground/60">
                    No staking positions yet
                  </p>
                  <p className="text-xs font-mono text-foreground/40">
                    Stake tokens to see rewards charts
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stakingPerformanceData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRewards"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#FFC700"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#FFC700"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                    <XAxis dataKey="month" stroke="#ffffff" />
                    <YAxis stroke="#ffffff" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#000000",
                        border: "1px solid #424242",
                        color: "#ffffff",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="rewards"
                      stroke="#FFC700"
                      fillOpacity={1}
                      fill="url(#colorRewards)"
                      name="Rewards Earned"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalStaked"
                      stroke="#ffffff"
                      strokeDasharray="5 5"
                      name="Total Staked"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Staking Positions Table */}
          <div className="border border-border bg-background p-6 mb-12">
            <h2 className="text-lg font-sentient mb-6">STAKING POSITIONS</h2>
            {isLoading ? (
              <TableSkeleton rows={3} columns={8} />
            ) : positions.length === 0 ? (
              <div className="border border-border/50 p-8 text-center space-y-2">
                <p className="text-sm font-mono text-foreground/60">
                  No active staking positions
                </p>
                <p className="text-xs font-mono text-foreground/40">
                  Stake tokens to start earning rewards
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-mono">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-3 text-foreground/60 font-medium">
                        ASSET
                      </th>
                      <th className="text-right p-3 text-foreground/60 font-medium">
                        STAKED AMOUNT
                      </th>
                      <th className="text-right p-3 text-foreground/60 font-medium">
                        DAILY REWARD
                      </th>
                      <th className="text-right p-3 text-foreground/60 font-medium">
                        PENDING REWARDS
                      </th>
                      <th className="text-right p-3 text-foreground/60 font-medium">
                        TOTAL CLAIMED
                      </th>
                      <th className="text-right p-3 text-foreground/60 font-medium">
                        APY
                      </th>
                      <th className="text-right p-3 text-foreground/60 font-medium">
                        TOTAL VALUE
                      </th>
                      <th className="text-right p-3 text-foreground/60 font-medium">
                        STARTED
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((position) => (
                      <tr
                        key={position.poolId}
                        className="border-b border-border/50 hover:bg-primary/5 transition-colors"
                      >
                        <td className="p-3 text-foreground font-bold">
                          {position.symbol}
                        </td>
                        <td className="text-right p-3 text-foreground">
                          {formatNumber(position.stakedAmount, 4)}
                        </td>
                        <td className="text-right p-3 text-green-500 font-bold">
                          +{formatNumber(position.dailyRewards, 6)}
                        </td>
                        <td className="text-right p-3 text-green-500">
                          +{formatNumber(position.pendingRewards, 4)}
                        </td>
                        <td className="text-right p-3 text-foreground/60">
                          {formatNumber(position.totalClaimed, 4)}
                        </td>
                        <td className="text-right p-3 text-primary font-bold">
                          {position.apy}%
                        </td>
                        <td className="text-right p-3 text-foreground font-bold">
                          {formatNumber(position.totalValue, 4)}
                        </td>
                        <td className="text-right p-3 text-foreground/60">
                          {formatDate(position.stakeTime)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Individual Staking Cards */}
          <div className="mb-12">
            <h2 className="text-lg font-sentient mb-6">STAKING BREAKDOWN</h2>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="border border-border bg-background p-6"
                  >
                    <div className="h-6 w-32 rounded bg-gradient-to-r from-border/20 to-border/40 mb-4 animate-pulse" />
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div key={`line-${j}`} className="flex justify-between">
                          <div className="h-4 w-20 rounded bg-gradient-to-r from-border/20 to-border/40 animate-pulse" />
                          <div className="h-4 w-24 rounded bg-gradient-to-r from-border/20 to-border/40 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : positions.length === 0 ? (
              <div className="border border-border/50 p-8 text-center space-y-2">
                <p className="text-sm font-mono text-foreground/60">
                  No active staking positions
                </p>
                <p className="text-xs font-mono text-foreground/40">
                  Stake tokens to start earning rewards
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {positions.map((position) => (
                  <div
                    key={position.poolId}
                    className="border border-green-500/30 bg-green-500/10 p-6 hover:border-green-500/50 transition-colors"
                  >
                    <h3 className="text-base font-sentient mb-4">
                      {position.symbol} Staking
                    </h3>
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground/60">
                          Amount Staked:
                        </span>
                        <span className="text-foreground font-bold">
                          {formatNumber(position.stakedAmount, 4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">
                          Daily Reward:
                        </span>
                        <span className="text-green-500 font-bold">
                          +{formatNumber(position.dailyRewards, 6)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">
                          Pending Rewards:
                        </span>
                        <span className="text-green-500">
                          +{formatNumber(position.pendingRewards, 4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">
                          Total Claimed:
                        </span>
                        <span className="text-foreground/60">
                          {formatNumber(position.totalClaimed, 4)}
                        </span>
                      </div>
                      <div className="border-t border-current/20 pt-3 flex justify-between">
                        <span className="text-foreground/60">APY:</span>
                        <span className="text-primary font-bold">
                          {position.apy}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Total Value:</span>
                        <span className="text-foreground font-bold">
                          {formatNumber(position.totalValue, 4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Status:</span>
                        <span className="font-bold text-green-500">Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Started:</span>
                        <span className="text-foreground/80">
                          {formatDate(position.stakeTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <button className="px-6 py-3 border border-border bg-background text-foreground font-mono text-sm font-medium transition-all duration-300 hover:border-primary hover:bg-primary/10">
                [BACK TO DASHBOARD]
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="px-6 py-3 border border-primary bg-primary/10 text-primary font-mono text-sm font-medium transition-all duration-300 hover:bg-primary/20">
                [ADD NEW STAKE]
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
