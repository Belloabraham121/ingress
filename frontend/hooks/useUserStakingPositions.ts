"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import StakingPoolsABI from "@/lib/contracts/StakingPools.abi.json";

const HEDERA_TESTNET_RPC = "https://testnet.hashio.io/api";
const STAKING_POOLS_ADDRESS = StakingPoolsABI.address;

// Pool IDs from deployment
const POOL_IDS = {
  USDC: 2,
  USDT: 3,
  DAI: 4,
};

// Pool metadata
const POOL_METADATA = [
  { id: POOL_IDS.USDC, name: "USDC Staking Pool", symbol: "USDC", apy: 12 },
  { id: POOL_IDS.USDT, name: "USDT Staking Pool", symbol: "USDT", apy: 15 },
  { id: POOL_IDS.DAI, name: "DAI Staking Pool", symbol: "DAI", apy: 10 },
];

// StakingPools ABI - functions we need
const STAKING_ABI = [
  "function getUserSummary(uint256 poolId, address user) external view returns (uint256 totalStaked, uint256 dailyRewards, uint256 pendingRewards, uint256 totalRewards, uint256 totalClaimed)",
  "function getUserStakeInfo(uint256 poolId, address user) external view returns (uint256 stakedAmount, uint256 pendingRewards, uint256 totalClaimed, uint256 stakeTime, uint256 totalValue)",
];

export interface UserStakingPosition {
  poolId: number;
  poolName: string;
  symbol: string;
  apy: number;
  stakedAmount: string; // Formatted
  stakedAmountRaw: bigint;
  dailyRewards: string; // Formatted
  dailyRewardsRaw: bigint;
  pendingRewards: string; // Formatted
  pendingRewardsRaw: bigint;
  totalRewards: string; // Formatted (claimed + pending)
  totalRewardsRaw: bigint;
  totalClaimed: string; // Formatted
  totalClaimedRaw: bigint;
  stakeTime: Date;
  totalValue: string; // Formatted (staked + pending)
  totalValueRaw: bigint;
}

export interface UserStakingSummary {
  totalStaked: string;
  totalStakedRaw: bigint;
  totalDailyRewards: string;
  totalDailyRewardsRaw: bigint;
  totalPendingRewards: string;
  totalPendingRewardsRaw: bigint;
  totalValue: string;
  totalValueRaw: bigint;
  positions: UserStakingPosition[];
}

export function useUserStakingPositions(userEvmAddress?: string) {
  const [positions, setPositions] = useState<UserStakingPosition[]>([]);
  const [summary, setSummary] = useState<UserStakingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPositions = useCallback(async () => {
    if (!userEvmAddress) {
      setPositions([]);
      setSummary(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new ethers.JsonRpcProvider(HEDERA_TESTNET_RPC);
      const stakingContract = new ethers.Contract(
        STAKING_POOLS_ADDRESS,
        STAKING_ABI,
        provider
      );

      // Check if contract exists
      const code = await provider.getCode(STAKING_POOLS_ADDRESS);
      if (code === "0x") {
        console.warn("StakingPools contract not deployed");
        setPositions([]);
        setSummary(null);
        setIsLoading(false);
        return;
      }

      const userPositions: UserStakingPosition[] = [];

      // Fetch data from each pool
      for (const poolMeta of POOL_METADATA) {
        try {
          // Get user summary for this pool
          const [
            totalStaked,
            dailyRewards,
            pendingRewards,
            totalRewards,
            totalClaimed,
          ] = await stakingContract.getUserSummary(poolMeta.id, userEvmAddress);

          // Get additional info (includes stake time)
          const [stakedAmount, , , stakeTime, totalValue] =
            await stakingContract.getUserStakeInfo(poolMeta.id, userEvmAddress);

          // Only include if user has a stake
          if (stakedAmount > BigInt(0)) {
            const position: UserStakingPosition = {
              poolId: poolMeta.id,
              poolName: poolMeta.name,
              symbol: poolMeta.symbol,
              apy: poolMeta.apy,
              stakedAmount: ethers.formatUnits(stakedAmount, 18),
              stakedAmountRaw: stakedAmount,
              dailyRewards: ethers.formatUnits(dailyRewards, 18),
              dailyRewardsRaw: dailyRewards,
              pendingRewards: ethers.formatUnits(pendingRewards, 18),
              pendingRewardsRaw: pendingRewards,
              totalRewards: ethers.formatUnits(totalRewards, 18),
              totalRewardsRaw: totalRewards,
              totalClaimed: ethers.formatUnits(totalClaimed, 18),
              totalClaimedRaw: totalClaimed,
              stakeTime: new Date(Number(stakeTime) * 1000),
              totalValue: ethers.formatUnits(totalValue, 18),
              totalValueRaw: totalValue,
            };

            userPositions.push(position);
          } else {
            console.log(
              `No stake in ${poolMeta.name} for user ${userEvmAddress}`
            );
          }
        } catch (poolError: any) {
          console.warn(
            `Skipping pool ${poolMeta.name} (ID: ${poolMeta.id}):`,
            poolError.message || poolError
          );
          // Continue with other pools even if one fails
        }
      }

      // Calculate totals
      const totalStakedRaw = userPositions.reduce(
        (sum, pos) => sum + pos.stakedAmountRaw,
        BigInt(0)
      );
      const totalDailyRewardsRaw = userPositions.reduce(
        (sum, pos) => sum + pos.dailyRewardsRaw,
        BigInt(0)
      );
      const totalPendingRewardsRaw = userPositions.reduce(
        (sum, pos) => sum + pos.pendingRewardsRaw,
        BigInt(0)
      );
      const totalValueRaw = userPositions.reduce(
        (sum, pos) => sum + pos.totalValueRaw,
        BigInt(0)
      );

      const summaryData: UserStakingSummary = {
        totalStaked: ethers.formatUnits(totalStakedRaw, 18),
        totalStakedRaw,
        totalDailyRewards: ethers.formatUnits(totalDailyRewardsRaw, 18),
        totalDailyRewardsRaw,
        totalPendingRewards: ethers.formatUnits(totalPendingRewardsRaw, 18),
        totalPendingRewardsRaw,
        totalValue: ethers.formatUnits(totalValueRaw, 18),
        totalValueRaw,
        positions: userPositions,
      };

      setPositions(userPositions);
      setSummary(summaryData);
    } catch (err: any) {
      console.error("Error fetching user staking positions:", err);
      setError(err.message || "Failed to fetch staking positions");
    } finally {
      setIsLoading(false);
    }
  }, [userEvmAddress]);

  useEffect(() => {
    fetchUserPositions();
  }, [fetchUserPositions]);

  return {
    positions,
    summary,
    isLoading,
    error,
    refresh: fetchUserPositions,
  };
}
