export interface VaultData {
  vaultAddress: string;
  asset: string;
  creator: string;
  name: string;
  symbol: string;
  apr: bigint;
  initialRewardsDeposit: bigint;
  createdAt: bigint;
  vaultIndex: bigint;
  active: boolean;
}

export interface VaultDetails extends VaultData {
  totalUserDeposits: bigint;
  rewardsPoolRemaining: bigint;
  depositorCount: bigint;
}

export interface FormattedVaultDetails {
  vaultAddress: string;
  asset: string;
  creator: string;
  name: string;
  symbol: string;
  apr: number; // Converted from basis points to percentage
  aprBps: number; // Original basis points
  initialRewardsDeposit: string; // Formatted string
  createdAt: Date;
  vaultIndex: number;
  active: boolean;
  totalUserDeposits: string; // Formatted string
  totalUserDepositsRaw: bigint;
  rewardsPoolRemaining: string; // Formatted string
  rewardsPoolRemainingRaw: bigint;
  depositorCount: number;
  // Calculated fields
  tvl: string; // Total Value Locked (formatted)
  tvlRaw: bigint;
  utilizationRate: number; // Percentage
  daysRemaining?: number; // Estimated days until rewards pool depleted
  dailyRewards?: string; // Estimated daily rewards payout
}

export interface VaultStats {
  totalVaults: number;
  activeVaults: number;
  totalTVL: string;
  totalTVLRaw: bigint;
  totalRewardsPool: string;
  totalRewardsPoolRaw: bigint;
  totalDepositors: number;
}
