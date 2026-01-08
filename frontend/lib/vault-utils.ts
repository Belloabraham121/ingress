import {
  VaultData,
  VaultDetails,
  FormattedVaultDetails,
  VaultStats,
} from "@/types/vault";

/**
 * Format a bigint token amount to a human-readable string
 * @param amount - The amount in wei (smallest unit)
 * @param decimals - Token decimals (default 18)
 * @param maxDecimals - Maximum decimal places to show (default 2)
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number = 18,
  maxDecimals: number = 2
): string {
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;

  if (fractionalPart === BigInt(0)) {
    return wholePart.toLocaleString();
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const truncated = fractionalStr.slice(0, maxDecimals);
  const formatted = `${wholePart.toLocaleString()}.${truncated}`;

  return formatted;
}

/**
 * Convert basis points to percentage
 * @param bps - Basis points (100 = 1%)
 */
export function bpsToPercent(bps: bigint | number): number {
  const bpsNum = typeof bps === "bigint" ? Number(bps) : bps;
  return bpsNum / 100;
}

/**
 * Calculate estimated daily rewards for a vault
 * @param totalDeposits - Total user deposits
 * @param aprBps - APR in basis points
 */
export function calculateDailyRewards(
  totalDeposits: bigint,
  aprBps: number
): bigint {
  if (totalDeposits === BigInt(0)) return BigInt(0);

  const aprRate = BigInt(aprBps);
  const secondsPerYear = BigInt(365 * 24 * 60 * 60);
  const basisPoints = BigInt(10000);

  // Daily rewards = (totalDeposits * aprBps * 86400) / (10000 * 31536000)
  const dailyRewards =
    (totalDeposits * aprRate * BigInt(86400)) / (basisPoints * secondsPerYear);

  return dailyRewards;
}

/**
 * Calculate estimated days until rewards pool is depleted
 * @param rewardsPool - Remaining rewards pool
 * @param dailyRewards - Daily rewards payout
 */
export function calculateDaysRemaining(
  rewardsPool: bigint,
  dailyRewards: bigint
): number {
  if (dailyRewards === BigInt(0)) return Infinity;
  if (rewardsPool === BigInt(0)) return 0;

  const days = Number(rewardsPool / dailyRewards);
  return Math.floor(days);
}

/**
 * Calculate utilization rate (how much of rewards pool is being used)
 * @param totalDeposits - Total user deposits
 * @param rewardsPool - Remaining rewards pool
 */
export function calculateUtilizationRate(
  totalDeposits: bigint,
  rewardsPool: bigint
): number {
  if (rewardsPool === BigInt(0)) return 100;
  if (totalDeposits === BigInt(0)) return 0;

  // Simple metric: deposits / (deposits + rewards) * 100
  const total = totalDeposits + rewardsPool;
  const rate = (Number(totalDeposits) / Number(total)) * 100;

  return Math.min(100, Math.max(0, rate));
}

/**
 * Format vault details for display
 */
export function formatVaultDetails(
  vaultData: VaultData,
  totalDeposits: bigint,
  rewardsPool: bigint,
  depositorCount: bigint
): FormattedVaultDetails {
  const aprBps = Number(vaultData.apr);
  const dailyRewards = calculateDailyRewards(totalDeposits, aprBps);
  const daysRemaining = calculateDaysRemaining(rewardsPool, dailyRewards);

  const tvl = totalDeposits + rewardsPool;

  return {
    vaultAddress: vaultData.vaultAddress,
    asset: vaultData.asset,
    creator: vaultData.creator,
    name: vaultData.name,
    symbol: vaultData.symbol,
    apr: bpsToPercent(vaultData.apr),
    aprBps: Number(vaultData.apr),
    initialRewardsDeposit: formatTokenAmount(vaultData.initialRewardsDeposit),
    createdAt: new Date(Number(vaultData.createdAt) * 1000),
    vaultIndex: Number(vaultData.vaultIndex),
    active: vaultData.active,
    totalUserDeposits: formatTokenAmount(totalDeposits),
    totalUserDepositsRaw: totalDeposits,
    rewardsPoolRemaining: formatTokenAmount(rewardsPool),
    rewardsPoolRemainingRaw: rewardsPool,
    depositorCount: Number(depositorCount),
    tvl: formatTokenAmount(tvl),
    tvlRaw: tvl,
    utilizationRate: calculateUtilizationRate(totalDeposits, rewardsPool),
    daysRemaining: daysRemaining === Infinity ? undefined : daysRemaining,
    dailyRewards: formatTokenAmount(dailyRewards),
  };
}

/**
 * Calculate aggregate stats from all vaults
 */
export function calculateVaultStats(
  vaults: FormattedVaultDetails[]
): VaultStats {
  const activeVaults = vaults.filter((v) => v.active);

  const totals = vaults.reduce(
    (acc, vault) => {
      return {
        tvl: acc.tvl + vault.tvlRaw,
        rewardsPool: acc.rewardsPool + vault.rewardsPoolRemainingRaw,
        depositors: acc.depositors + vault.depositorCount,
      };
    },
    {
      tvl: BigInt(0),
      rewardsPool: BigInt(0),
      depositors: 0,
    }
  );

  return {
    totalVaults: vaults.length,
    activeVaults: activeVaults.length,
    totalTVL: formatTokenAmount(totals.tvl),
    totalTVLRaw: totals.tvl,
    totalRewardsPool: formatTokenAmount(totals.rewardsPool),
    totalRewardsPoolRaw: totals.rewardsPool,
    totalDepositors: totals.depositors,
  };
}

/**
 * Sort vaults by different criteria
 */
export type VaultSortCriteria =
  | "apr"
  | "tvl"
  | "rewards"
  | "depositors"
  | "created";

export function sortVaults(
  vaults: FormattedVaultDetails[],
  criteria: VaultSortCriteria,
  ascending: boolean = false
): FormattedVaultDetails[] {
  const sorted = [...vaults].sort((a, b) => {
    let comparison = 0;

    switch (criteria) {
      case "apr":
        comparison = a.aprBps - b.aprBps;
        break;
      case "tvl":
        comparison = Number(a.tvlRaw - b.tvlRaw);
        break;
      case "rewards":
        comparison = Number(
          a.rewardsPoolRemainingRaw - b.rewardsPoolRemainingRaw
        );
        break;
      case "depositors":
        comparison = a.depositorCount - b.depositorCount;
        break;
      case "created":
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
    }

    return ascending ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Filter vaults by criteria
 */
export function filterVaults(
  vaults: FormattedVaultDetails[],
  filters: {
    activeOnly?: boolean;
    minAPR?: number;
    maxAPR?: number;
    minTVL?: bigint;
    searchTerm?: string;
  }
): FormattedVaultDetails[] {
  return vaults.filter((vault) => {
    // Active filter
    if (filters.activeOnly && !vault.active) return false;

    // APR filters
    if (filters.minAPR !== undefined && vault.apr < filters.minAPR)
      return false;
    if (filters.maxAPR !== undefined && vault.apr > filters.maxAPR)
      return false;

    // TVL filter
    if (filters.minTVL !== undefined && vault.tvlRaw < filters.minTVL)
      return false;

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      return (
        vault.name.toLowerCase().includes(term) ||
        vault.symbol.toLowerCase().includes(term) ||
        vault.vaultAddress.toLowerCase().includes(term)
      );
    }

    return true;
  });
}
