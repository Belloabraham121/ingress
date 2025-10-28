"use client";

import { useVaults } from "@/hooks/useVaults";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  TrendingUp,
  Users,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function VaultList() {
  const { vaults, stats, isLoading, error, refresh, sortVaultsBy } =
    useVaults();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Vaults
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVaults}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeVaults} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total TVL</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTVL}</div>
              <p className="text-xs text-muted-foreground">Tokens locked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Rewards Pool
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRewardsPool}</div>
              <p className="text-xs text-muted-foreground">Available rewards</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Depositors
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDepositors}</div>
              <p className="text-xs text-muted-foreground">Unique users</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Vaults</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => sortVaultsBy("apr")}
          >
            Sort by APY
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sortVaultsBy("tvl")}
          >
            Sort by TVL
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Vault Cards */}
      {isLoading && vaults.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vaults.map((vault) => (
            <Card
              key={vault.vaultAddress}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{vault.name}</CardTitle>
                  {vault.active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <CardDescription>{vault.symbol}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* APY */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">APY</span>
                  <span className="text-lg font-bold text-green-600">
                    {vault.apr.toFixed(2)}%
                  </span>
                </div>

                {/* TVL */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">TVL</span>
                  <span className="text-sm font-medium">{vault.tvl}</span>
                </div>

                {/* Rewards Pool */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Rewards Pool
                  </span>
                  <span className="text-sm font-medium">
                    {vault.rewardsPoolRemaining}
                  </span>
                </div>

                {/* Depositors */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Depositors
                  </span>
                  <span className="text-sm font-medium">
                    {vault.depositorCount}
                  </span>
                </div>

                {/* Utilization */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Utilization
                  </span>
                  <span className="text-sm font-medium">
                    {vault.utilizationRate.toFixed(1)}%
                  </span>
                </div>

                {/* Days Remaining */}
                {vault.daysRemaining !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Days Left
                    </span>
                    <span className="text-sm font-medium">
                      {vault.daysRemaining > 365
                        ? "1+ year"
                        : `${vault.daysRemaining} days`}
                    </span>
                  </div>
                )}

                {/* Action Button */}
                <Button className="w-full mt-4" disabled={!vault.active}>
                  {vault.active ? "Deposit" : "Inactive"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && vaults.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No vaults found</p>
            <p className="text-sm text-muted-foreground">
              Deploy your first vault to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
