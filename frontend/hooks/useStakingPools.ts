"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import StakingPoolsABI from "@/lib/contracts/StakingPools.abi.json";

const STAKING_POOLS_ADDRESS = StakingPoolsABI.address;
const HEDERA_TESTNET_RPC = "https://testnet.hashio.io/api";

// Pool IDs for deployed staking pools
export const POOL_IDS = {
  USDC: 2,
  USDT: 3,
  DAI: 4,
} as const;

export interface PoolInfo {
  id: number;
  token: string;
  name: string;
  apy: number; // in basis points (e.g., 1200 = 12%)
  apyPercentage: number; // calculated percentage (e.g., 12)
  totalStaked: bigint;
  totalStakedFormatted: string;
  rewardsPool: bigint;
  rewardsPoolFormatted: string;
  totalRewardsClaimed: bigint;
  minStake: bigint;
  minStakeFormatted: string;
  maxStakePerUser: bigint;
  maxStakePerUserFormatted: string;
  createdAt: number;
  active: boolean;
  stakerCount: number;
}

export interface UserStake {
  amount: bigint;
  amountFormatted: string;
  stakeTime: number;
  lastClaimTime: number;
  totalClaimed: bigint;
  totalClaimedFormatted: string;
  pendingRewards: bigint;
  pendingRewardsFormatted: string;
}

/**
 * Custom hook to interact with StakingPools contract on Hedera
 */
export function useStakingPools(userAddress?: string) {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [userStakes, setUserStakes] = useState<Map<number, UserStake>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  // Initialize provider and contract
  useEffect(() => {
    try {
      const rpcProvider = new ethers.JsonRpcProvider(HEDERA_TESTNET_RPC);
      setProvider(rpcProvider);

      const stakingPoolsContract = new ethers.Contract(
        STAKING_POOLS_ADDRESS,
        StakingPoolsABI.abi,
        rpcProvider
      );
      setContract(stakingPoolsContract);
    } catch (err) {
      console.error("Failed to initialize provider:", err);
      setError("Failed to connect to Hedera network");
    }
  }, []);

  /**
   * Format pool info from contract data
   */
  const formatPoolInfo = (
    id: number,
    token: string,
    name: string,
    apy: bigint,
    totalStaked: bigint,
    rewardsPool: bigint,
    totalRewardsClaimed: bigint,
    minStake: bigint,
    maxStakePerUser: bigint,
    createdAt: bigint,
    active: boolean,
    stakerCount: bigint
  ): PoolInfo => {
    const apyBasisPoints = Number(apy);
    const apyPercentage = apyBasisPoints / 100;

    return {
      id,
      token,
      name,
      apy: apyBasisPoints,
      apyPercentage,
      totalStaked,
      totalStakedFormatted: ethers.formatUnits(totalStaked, 18),
      rewardsPool,
      rewardsPoolFormatted: ethers.formatUnits(rewardsPool, 18),
      totalRewardsClaimed,
      minStake,
      minStakeFormatted: ethers.formatUnits(minStake, 18),
      maxStakePerUser,
      maxStakePerUserFormatted: ethers.formatUnits(maxStakePerUser, 18),
      createdAt: Number(createdAt),
      active,
      stakerCount: Number(stakerCount),
    };
  };

  /**
   * Fetch info for a single pool
   */
  const fetchPoolInfo = useCallback(
    async (poolId: number): Promise<PoolInfo | null> => {
      if (!contract) {
        setError("Contract not initialized");
        return null;
      }

      try {
        console.log(`Fetching pool info for pool ID: ${poolId}`);

        const [
          id,
          token,
          name,
          apy,
          totalStaked,
          rewardsPool,
          totalRewardsClaimed,
          minStake,
          maxStakePerUser,
          createdAt,
          active,
          stakerCount,
        ] = await contract.getPoolInfo(poolId);

        const poolInfo = formatPoolInfo(
          Number(id),
          token,
          name,
          apy,
          totalStaked,
          rewardsPool,
          totalRewardsClaimed,
          minStake,
          maxStakePerUser,
          createdAt,
          active,
          stakerCount
        );

        console.log(`Pool ${poolId} info:`, poolInfo);
        return poolInfo;
      } catch (err: any) {
        console.error(`Error fetching pool ${poolId}:`, err);
        return null;
      }
    },
    [contract]
  );

  /**
   * Fetch all deployed pools (IDs 2, 3, 4)
   */
  const fetchAllPools = useCallback(async () => {
    if (!contract) {
      setError("Contract not initialized");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching all staking pools...");

      const poolIds = Object.values(POOL_IDS);
      const poolPromises = poolIds.map((poolId) => fetchPoolInfo(poolId));
      const poolResults = await Promise.all(poolPromises);

      // Filter out null results (failed fetches)
      const validPools = poolResults.filter(
        (pool): pool is PoolInfo => pool !== null
      );

      setPools(validPools);
      console.log(`Successfully fetched ${validPools.length} pools`);
    } catch (err: any) {
      console.error("Error fetching pools:", err);
      setError(err.message || "Failed to fetch pools");
    } finally {
      setIsLoading(false);
    }
  }, [contract, fetchPoolInfo]);

  /**
   * Fetch user stake for a specific pool
   */
  const fetchUserStake = useCallback(
    async (poolId: number, address: string): Promise<UserStake | null> => {
      if (!contract) {
        setError("Contract not initialized");
        return null;
      }

      if (!address || !ethers.isAddress(address)) {
        console.log("Invalid address provided");
        return null;
      }

      try {
        console.log(`Fetching user stake for pool ${poolId}, user ${address}`);

        const [amount, stakeTime, lastClaimTime, totalClaimed] =
          await contract.getUserStake(poolId, address);

        // Calculate pending rewards
        let pendingRewards = BigInt(0);
        try {
          pendingRewards = await contract.calculateRewards(poolId, address);
        } catch (err) {
          console.log("Could not calculate rewards:", err);
        }

        const userStake: UserStake = {
          amount,
          amountFormatted: ethers.formatUnits(amount, 18),
          stakeTime: Number(stakeTime),
          lastClaimTime: Number(lastClaimTime),
          totalClaimed,
          totalClaimedFormatted: ethers.formatUnits(totalClaimed, 18),
          pendingRewards,
          pendingRewardsFormatted: ethers.formatUnits(pendingRewards, 18),
        };

        return userStake;
      } catch (err: any) {
        console.error(`Error fetching user stake for pool ${poolId}:`, err);
        return null;
      }
    },
    [contract]
  );

  /**
   * Fetch user stakes for all pools
   */
  const fetchAllUserStakes = useCallback(
    async (address: string) => {
      if (!contract || !address || !ethers.isAddress(address)) {
        return;
      }

      try {
        console.log("Fetching user stakes for all pools...");

        const poolIds = Object.values(POOL_IDS);
        const stakePromises = poolIds.map((poolId) =>
          fetchUserStake(poolId, address)
        );
        const stakeResults = await Promise.all(stakePromises);

        const stakesMap = new Map<number, UserStake>();
        stakeResults.forEach((stake, index) => {
          if (stake) {
            stakesMap.set(poolIds[index], stake);
          }
        });

        setUserStakes(stakesMap);
        console.log(`Fetched stakes for ${stakesMap.size} pools`);
      } catch (err: any) {
        console.error("Error fetching user stakes:", err);
      }
    },
    [contract, fetchUserStake]
  );

  /**
   * Get pool info by token symbol
   */
  const getPoolByToken = useCallback(
    (tokenSymbol: string): PoolInfo | undefined => {
      return pools.find((pool) =>
        pool.name.toLowerCase().includes(tokenSymbol.toLowerCase())
      );
    },
    [pools]
  );

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await fetchAllPools();
    if (userAddress) {
      await fetchAllUserStakes(userAddress);
    }
  }, [fetchAllPools, fetchAllUserStakes, userAddress]);

  // Auto-fetch pools on mount
  useEffect(() => {
    if (contract) {
      fetchAllPools();
    }
  }, [contract, fetchAllPools]);

  // Auto-fetch user stakes when user address changes
  useEffect(() => {
    if (contract && userAddress && ethers.isAddress(userAddress)) {
      fetchAllUserStakes(userAddress);
    }
  }, [contract, userAddress, fetchAllUserStakes]);

  return {
    // Data
    pools,
    userStakes,
    provider,
    contract,

    // State
    isLoading,
    error,

    // Actions
    fetchPoolInfo,
    fetchAllPools,
    fetchUserStake,
    fetchAllUserStakes,
    getPoolByToken,
    refresh,
    setError,
  };
}
