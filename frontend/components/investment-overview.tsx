"use client";

import { useEffect, useState } from "react";
import { useUserVaultPositions } from "@/hooks/useUserVaultPositions";
import { useAuth } from "@/hooks/useAuth";
import { getEvmAddressFromAccountId } from "@/lib/hedera-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function InvestmentOverview() {
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

  if (error) {
    return (
      <div className="border border-border bg-background p-6 space-y-6">
        <div>
          <h3 className="text-lg font-sentient mb-2">TOKEN VAULT POSITIONS</h3>
          <p className="text-xs font-mono text-foreground/60">
            Track your active vault deposits and real-time APY
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-mono text-sm">
            {error}
          </AlertDescription>
        </Alert>
        <button
          onClick={refresh}
          className="w-full px-6 py-3 border border-border bg-background text-foreground font-mono text-sm font-medium transition-all duration-300 hover:border-primary hover:bg-primary/10 flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          [RETRY]
        </button>
      </div>
    );
  }

  return (
    <div className="border border-border bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-sentient mb-2">TOKEN VAULT POSITIONS</h3>
          <p className="text-xs font-mono text-foreground/60">
            Track your active vault deposits and real-time APY
          </p>
        </div>
        {!isLoading && (
          <button
            onClick={refresh}
            className="p-2 hover:bg-foreground/5 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-foreground/60" />
          </button>
        )}
      </div>

      {/* Summary Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border/50 p-4">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="border border-border/50 p-4">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border/50 p-4">
            <p className="text-xs font-mono text-foreground/60 mb-2">
              TOTAL CURRENT VALUE
            </p>
            <p className="text-2xl font-sentient text-primary">
              {formatNumber(summary?.totalCurrentValue || "0")}{" "}
              {positions[0]?.symbol || ""}
            </p>
            <p className="text-xs font-mono text-foreground/40 mt-1">
              Deposited: {formatNumber(summary?.totalDeposited || "0")}
            </p>
          </div>
          <div className="border border-border/50 p-4">
            <p className="text-xs font-mono text-foreground/60 mb-2">
              TOTAL PROFIT EARNED
            </p>
            <p className="text-2xl font-sentient text-green-500">
              +{formatNumber(summary?.totalProjectedReturn || "0")}{" "}
              {positions[0]?.symbol || ""}
            </p>
            <p className="text-xs font-mono text-foreground/40 mt-1">
              Pending: {formatNumber(summary?.totalPendingRewards || "0")}
            </p>
          </div>
        </div>
      )}

      {/* Vault Positions Table */}
      {isLoading ? (
        <div className="border border-border/50 p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
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
        <div className="border border-border/50 overflow-x-auto">
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
                  APY
                </th>
                <th className="text-right p-3 text-foreground/60 font-medium">
                  CURRENT VALUE
                </th>
                <th className="text-right p-3 text-foreground/60 font-medium">
                  TOTAL PROFIT
                </th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr
                  key={position.vaultAddress}
                  className="border-b border-border/50 hover:bg-primary/5 transition-colors"
                >
                  <td className="p-3 text-foreground">
                    <div>
                      <p className="font-medium">{position.vaultName}</p>
                      <p className="text-xs text-foreground/50">
                        {position.symbol}
                      </p>
                    </div>
                  </td>
                  <td className="text-right p-3 text-foreground">
                    {formatNumber(position.depositAmount, 4)}
                  </td>
                  <td className="text-right p-3 text-primary font-bold">
                    {position.apy}%
                  </td>
                  <td className="text-right p-3 text-green-500 font-bold">
                    {formatNumber(position.currentValue, 4)}
                  </td>
                  <td className="text-right p-3 text-green-500">
                    +{formatNumber(position.projectedAnnualReturn, 4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
