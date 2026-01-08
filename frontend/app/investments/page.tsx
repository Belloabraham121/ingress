"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
import { useUserVaultPositions } from "@/hooks/useUserVaultPositions";
import { useAuth } from "@/hooks/useAuth";
import { getEvmAddressFromAccountId } from "@/lib/hedera-utils";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function InvestmentsPage() {
  const { getProfile } = useAuth();
  const [userEvmAddress, setUserEvmAddress] = useState<string | undefined>();
  const { positions, summary, isLoading, error, refresh } =
    useUserVaultPositions(userEvmAddress);

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

  // Calculate totals
  const totalDeposited = parseFloat(summary?.totalDeposited || "0");
  const totalCurrentValue = parseFloat(summary?.totalCurrentValue || "0");
  const totalGainLoss = totalCurrentValue - totalDeposited;
  const totalGainLossPercent =
    totalDeposited > 0 ? (totalGainLoss / totalDeposited) * 100 : 0;

  // Generate performance data for chart
  const performanceData = useMemo(() => {
    if (positions.length === 0) {
      return [{ month: "Now", value: 0, deposited: 0 }];
    }

    const currentDeposit = parseFloat(summary?.totalDeposited || "0");
    const currentValue = parseFloat(summary?.totalCurrentValue || "0");

    // Find earliest deposit date from actual contract data
    const earliestDeposit = positions.reduce((earliest, pos) => {
      return pos.depositTime < earliest ? pos.depositTime : earliest;
    }, positions[0]?.depositTime || new Date());

    const now = new Date();
    const daysSinceDeposit = Math.floor(
      (now.getTime() - earliestDeposit.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate weighted average APY from all positions
    const totalDeposits = positions.reduce(
      (sum, pos) => sum + parseFloat(pos.depositAmount),
      0
    );
    const weightedAPY =
      positions.reduce((sum, pos) => {
        const weight = parseFloat(pos.depositAmount) / totalDeposits;
        return sum + pos.apy * weight;
      }, 0) / 100;

    // Helper to calculate future value with compound interest
    const calculateFutureValue = (daysFromNow: number) => {
      const years = (daysSinceDeposit + daysFromNow) / 365;
      return currentDeposit * Math.pow(1 + weightedAPY, years);
    };

    // Format date labels
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

    return [
      {
        month: formatDateLabel(earliestDeposit),
        value: currentDeposit,
        deposited: currentDeposit,
      },
      {
        month: "Now",
        value: currentValue,
        deposited: currentDeposit,
      },
      {
        month: futureDate(30),
        value: calculateFutureValue(30),
        deposited: currentDeposit,
      },
      {
        month: futureDate(90),
        value: calculateFutureValue(90),
        deposited: currentDeposit,
      },
      {
        month: futureDate(180),
        value: calculateFutureValue(180),
        deposited: currentDeposit,
      },
      {
        month: futureDate(365),
        value: calculateFutureValue(365),
        deposited: currentDeposit,
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
        <div className="flex gap-3">
          <Link href="/staking">
            <button className="px-6 py-3 border border-border bg-background text-foreground font-mono text-sm font-medium transition-all duration-300 hover:border-primary hover:bg-primary/10">
              [View Staking]
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="px-6 py-3 border border-border bg-background text-foreground font-mono text-sm font-medium transition-all duration-300 hover:border-primary hover:bg-primary/10">
              [Back to Dashboard]
            </button>
          </Link>
        </div>
      </div>

      <main className="pt-12 pb-16">
        <div className="container">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-sentient mb-4">
              Token <i className="font-light">Vault System</i>
            </h1>
            <p className="font-mono text-sm text-foreground/60 max-w-[500px]">
              Deposit your tokens into secure vaults and earn real-time APY
              rewards with flexible withdrawal options
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
                  TOTAL DEPOSITED
                </p>
                <p className="text-2xl font-sentient text-primary">
                  {formatNumber(summary?.totalDeposited || "0", 2)}{" "}
                  {positions[0]?.symbol || ""}
                </p>
              </div>
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">
                  CURRENT VALUE
                </p>
                <p className="text-2xl font-sentient text-primary">
                  {formatNumber(summary?.totalCurrentValue || "0", 2)}{" "}
                  {positions[0]?.symbol || ""}
                </p>
              </div>
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">
                  TOTAL GAIN/LOSS
                </p>
                <p
                  className={`text-2xl font-sentient ${
                    totalGainLoss >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {totalGainLoss >= 0 ? "+" : ""}
                  {formatNumber(totalGainLoss.toString(), 2)}{" "}
                  {positions[0]?.symbol || ""}
                </p>
              </div>
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">
                  RETURN %
                </p>
                <p
                  className={`text-2xl font-sentient ${
                    totalGainLossPercent >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {totalGainLossPercent >= 0 ? "+" : ""}
                  {totalGainLossPercent.toFixed(2)}%
                </p>
              </div>
            </div>
          )}

          {/* Performance Chart */}
          <div className="border border-border bg-background p-6 mb-12">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-lg font-sentient">VAULT PERFORMANCE</h2>
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
                    No vault positions yet
                  </p>
                  <p className="text-xs font-mono text-foreground/40">
                    Deposit to a vault to see performance charts
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={performanceData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorValue"
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
                      dataKey="value"
                      stroke="#FFC700"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      name="Vault Value"
                    />
                    <Line
                      type="monotone"
                      dataKey="deposited"
                      stroke="#ffffff"
                      strokeDasharray="5 5"
                      name="Total Deposited"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Detailed Vaults Table */}
          <div className="border border-border bg-background p-6 mb-12">
            <h2 className="text-lg font-sentient mb-6">VAULT DETAILS</h2>
            {isLoading ? (
              <TableSkeleton rows={3} columns={8} />
            ) : positions.length === 0 ? (
              <div className="border border-border/50 p-8 text-center space-y-2">
                <p className="text-sm font-mono text-foreground/60">
                  No active vault positions
                </p>
                <p className="text-xs font-mono text-foreground/40">
                  Deposit to a vault to start earning rewards
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-mono">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-3 text-foreground/60 font-medium">
                        VAULT
                      </th>
                      <th className="text-right p-3 text-foreground/60 font-medium">
                        DEPOSITED
                      </th>
                      <th className="text-right p-3 text-foreground/60 font-medium">
                        CURRENT VALUE
                      </th>
                      <th className="text-right p-3 text-foreground/60 font-medium">
                        GAIN/LOSS
                      </th>
                      <th className="text-right p-3 text-foreground/60 font-medium">
                        RETURN %
                      </th>
                      <th className="text-right p-3 text-foreground/60 font-medium">
                        APY
                      </th>
                      <th className="text-right p-3 text-foreground/60 font-medium">
                        PENDING REWARDS
                      </th>
                      <th className="text-right p-3 text-foreground/60 font-medium">
                        DEPOSIT DATE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((position) => {
                      const deposited = parseFloat(position.depositAmount);
                      const currentVal = parseFloat(position.currentValue);
                      const gainLoss = currentVal - deposited;
                      const returnPercent =
                        deposited > 0 ? (gainLoss / deposited) * 100 : 0;

                      return (
                        <tr
                          key={position.vaultAddress}
                          className="border-b border-border/50 hover:bg-primary/5 transition-colors"
                        >
                          <td className="p-3 text-foreground">
                            <div>
                              <p className="font-medium">
                                {position.vaultName}
                              </p>
                              <p className="text-xs text-foreground/50">
                                {position.symbol}
                              </p>
                            </div>
                          </td>
                          <td className="text-right p-3 text-foreground">
                            {formatNumber(position.depositAmount, 4)}
                          </td>
                          <td className="text-right p-3 text-foreground">
                            {formatNumber(position.currentValue, 4)}
                          </td>
                          <td
                            className={`text-right p-3 font-bold ${
                              gainLoss >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {gainLoss >= 0 ? "+" : ""}
                            {formatNumber(gainLoss.toString(), 4)}
                          </td>
                          <td
                            className={`text-right p-3 font-bold ${
                              returnPercent >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {returnPercent >= 0 ? "+" : ""}
                            {returnPercent.toFixed(2)}%
                          </td>
                          <td className="text-right p-3 text-primary font-bold">
                            {position.apy}%
                          </td>
                          <td className="text-right p-3 text-green-500 font-bold">
                            +{formatNumber(position.pendingRewards, 4)}
                          </td>
                          <td className="text-right p-3 text-foreground/60">
                            {formatDate(position.depositTime)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Individual Vault Cards */}
          <div className="mb-12">
            <h2 className="text-lg font-sentient mb-6">VAULT BREAKDOWN</h2>
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
                  No active vault positions
                </p>
                <p className="text-xs font-mono text-foreground/40">
                  Deposit to a vault to start earning rewards
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {positions.map((position) => {
                  const deposited = parseFloat(position.depositAmount);
                  const currentVal = parseFloat(position.currentValue);
                  const gainLoss = currentVal - deposited;
                  const returnPercent =
                    deposited > 0 ? (gainLoss / deposited) * 100 : 0;

                  return (
                    <div
                      key={position.vaultAddress}
                      className="border border-border bg-background p-6 hover:border-primary/50 transition-colors"
                    >
                      <h3 className="text-base font-sentient mb-4">
                        {position.vaultName}
                      </h3>
                      <div className="space-y-3 font-mono text-sm">
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Token:</span>
                          <span className="text-foreground font-medium">
                            {position.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Deposited:</span>
                          <span className="text-foreground">
                            {formatNumber(position.depositAmount, 4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">
                            Current Value:
                          </span>
                          <span className="text-foreground">
                            {formatNumber(position.currentValue, 4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Gain/Loss:</span>
                          <span
                            className={
                              gainLoss >= 0 ? "text-green-500" : "text-red-500"
                            }
                          >
                            {gainLoss >= 0 ? "+" : ""}
                            {formatNumber(gainLoss.toString(), 4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Return:</span>
                          <span
                            className={
                              returnPercent >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            {returnPercent >= 0 ? "+" : ""}
                            {returnPercent.toFixed(2)}%
                          </span>
                        </div>
                        <div className="border-t border-border/50 pt-3 flex justify-between">
                          <span className="text-foreground/60">APY:</span>
                          <span className="text-primary font-bold">
                            {position.apy}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">
                            Pending Rewards:
                          </span>
                          <span className="text-green-500 font-bold">
                            +{formatNumber(position.pendingRewards, 4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Deposited:</span>
                          <span className="text-foreground/80">
                            {formatDate(position.depositTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                [DEPOSIT TO VAULT]
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
