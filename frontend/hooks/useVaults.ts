"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  FormattedVaultDetails,
  VaultStats,
  VaultSortCriteria,
} from "@/types/vault";
import {
  formatVaultDetails,
  calculateVaultStats,
  sortVaults,
  filterVaults,
} from "@/lib/vault-utils";
import VaultFactoryABI from "@/lib/contracts/VaultFactory.json";

const VAULT_FACTORY_ADDRESS = VaultFactoryABI.address;
const HEDERA_TESTNET_RPC = "https://testnet.hashio.io/api";

/**
 * Custom hook to interact with VaultFactory contract on Hedera
 * Uses ethers.js for EVM-compatible contract interactions
 */
export function useVaults() {
  const [vaults, setVaults] = useState<FormattedVaultDetails[]>([]);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  // Initialize provider and contract
  useEffect(() => {
    try {
      const rpcProvider = new ethers.JsonRpcProvider(HEDERA_TESTNET_RPC);
      setProvider(rpcProvider);

      const vaultFactoryContract = new ethers.Contract(
        VAULT_FACTORY_ADDRESS,
        VaultFactoryABI.abi,
        rpcProvider
      );
      setContract(vaultFactoryContract);
    } catch (err) {
      console.error("Failed to initialize provider:", err);
      setError("Failed to connect to Hedera network");
    }
  }, []);

  /**
   * Fetch all vaults from the factory
   */
  const fetchVaults = useCallback(async () => {
    if (!contract) {
      setError("Contract not initialized");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching all vault addresses...");

      // Step 1: Get all vault addresses
      const vaultAddresses = await contract.getAllVaults();
      console.log(`Found ${vaultAddresses.length} vaults`);

      if (vaultAddresses.length === 0) {
        setVaults([]);
        setStats({
          totalVaults: 0,
          activeVaults: 0,
          totalTVL: "0",
          totalTVLRaw: BigInt(0),
          totalRewardsPool: "0",
          totalRewardsPoolRaw: BigInt(0),
          totalDepositors: 0,
        });
        return;
      }

      // Step 2: Get detailed info for all vaults in one call
      console.log("Fetching vault details...");
      const [vaultDatas, totalDeposits, rewardPools, depositorCounts] =
        await contract.getMultipleVaultDetails(vaultAddresses);

      // Step 3: Format the data
      const formattedVaults: FormattedVaultDetails[] = vaultDatas.map(
        (vaultData: any, index: number) => {
          return formatVaultDetails(
            {
              vaultAddress: vaultData.vaultAddress,
              asset: vaultData.asset,
              creator: vaultData.creator,
              name: vaultData.name,
              symbol: vaultData.symbol,
              apr: BigInt(vaultData.apr),
              initialRewardsDeposit: BigInt(vaultData.initialRewardsDeposit),
              createdAt: BigInt(vaultData.createdAt),
              vaultIndex: BigInt(vaultData.vaultIndex),
              active: vaultData.active,
            },
            BigInt(totalDeposits[index]),
            BigInt(rewardPools[index]),
            BigInt(depositorCounts[index])
          );
        }
      );

      // Step 4: Calculate aggregate stats
      const vaultStats = calculateVaultStats(formattedVaults);

      setVaults(formattedVaults);
      setStats(vaultStats);

      console.log("Successfully fetched vault data:", {
        totalVaults: formattedVaults.length,
        activeVaults: formattedVaults.filter((v) => v.active).length,
      });
    } catch (err: any) {
      console.error("Error fetching vaults:", err);
      setError(err.message || "Failed to fetch vaults");
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  /**
   * Fetch details for a single vault
   */
  const fetchVaultDetails = useCallback(
    async (vaultAddress: string): Promise<FormattedVaultDetails | null> => {
      if (!contract) {
        setError("Contract not initialized");
        return null;
      }

      try {
        console.log(`Fetching details for vault: ${vaultAddress}`);

        const [
          address,
          asset,
          creator,
          name,
          symbol,
          apr,
          initialDeposit,
          createdAt,
          active,
          totalUserDeposits,
          rewardsPoolRemaining,
          totalRewardsClaimed,
          totalDepositors,
        ] = await contract.getVaultDetails(vaultAddress);

        const formatted = formatVaultDetails(
          {
            vaultAddress: address,
            asset,
            creator,
            name,
            symbol,
            apr: BigInt(apr),
            initialRewardsDeposit: BigInt(initialDeposit),
            createdAt: BigInt(createdAt),
            vaultIndex: BigInt(0), // Not returned by single vault query
            active,
          },
          BigInt(totalUserDeposits),
          BigInt(rewardsPoolRemaining),
          BigInt(totalDepositors)
        );

        return formatted;
      } catch (err: any) {
        console.error("Error fetching vault details:", err);
        setError(err.message || "Failed to fetch vault details");
        return null;
      }
    },
    [contract]
  );

  /**
   * Get total number of vaults
   */
  const getTotalVaults = useCallback(async (): Promise<number> => {
    if (!contract) {
      setError("Contract not initialized");
      return 0;
    }

    try {
      const total = await contract.getTotalVaults();
      return Number(total);
    } catch (err: any) {
      console.error("Error getting total vaults:", err);
      setError(err.message || "Failed to get total vaults");
      return 0;
    }
  }, [contract]);

  /**
   * Get only active vaults
   */
  const fetchActiveVaults = useCallback(async () => {
    if (!contract) {
      setError("Contract not initialized");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching active vault addresses...");

      // Get active vault addresses
      const activeVaultAddresses = await contract.getActiveVaults();
      console.log(`Found ${activeVaultAddresses.length} active vaults`);

      if (activeVaultAddresses.length === 0) {
        setVaults([]);
        setStats({
          totalVaults: 0,
          activeVaults: 0,
          totalTVL: "0",
          totalTVLRaw: BigInt(0),
          totalRewardsPool: "0",
          totalRewardsPoolRaw: BigInt(0),
          totalDepositors: 0,
        });
        return;
      }

      // Get detailed info for active vaults
      const [vaultDatas, totalDeposits, rewardPools, depositorCounts] =
        await contract.getMultipleVaultDetails(activeVaultAddresses);

      const formattedVaults: FormattedVaultDetails[] = vaultDatas.map(
        (vaultData: any, index: number) => {
          return formatVaultDetails(
            {
              vaultAddress: vaultData.vaultAddress,
              asset: vaultData.asset,
              creator: vaultData.creator,
              name: vaultData.name,
              symbol: vaultData.symbol,
              apr: BigInt(vaultData.apr),
              initialRewardsDeposit: BigInt(vaultData.initialRewardsDeposit),
              createdAt: BigInt(vaultData.createdAt),
              vaultIndex: BigInt(vaultData.vaultIndex),
              active: vaultData.active,
            },
            BigInt(totalDeposits[index]),
            BigInt(rewardPools[index]),
            BigInt(depositorCounts[index])
          );
        }
      );

      const vaultStats = calculateVaultStats(formattedVaults);

      setVaults(formattedVaults);
      setStats(vaultStats);
    } catch (err: any) {
      console.error("Error fetching active vaults:", err);
      setError(err.message || "Failed to fetch active vaults");
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  /**
   * Sort vaults by criteria
   */
  const sortVaultsBy = useCallback(
    (criteria: VaultSortCriteria, ascending: boolean = false) => {
      const sorted = sortVaults(vaults, criteria, ascending);
      setVaults(sorted);
    },
    [vaults]
  );

  /**
   * Filter vaults
   */
  const filterVaultsBy = useCallback(
    (filters: {
      activeOnly?: boolean;
      minAPR?: number;
      maxAPR?: number;
      minTVL?: bigint;
      searchTerm?: string;
    }) => {
      const filtered = filterVaults(vaults, filters);
      return filtered;
    },
    [vaults]
  );

  /**
   * Refresh vault data
   */
  const refresh = useCallback(() => {
    fetchVaults();
  }, [fetchVaults]);

  // Auto-fetch on mount
  useEffect(() => {
    if (contract) {
      fetchVaults();
    }
  }, [contract, fetchVaults]);

  return {
    // Data
    vaults,
    stats,
    provider,
    contract,

    // State
    isLoading,
    error,

    // Actions
    fetchVaults,
    fetchActiveVaults,
    fetchVaultDetails,
    getTotalVaults,
    sortVaultsBy,
    filterVaultsBy,
    refresh,
    setError,
  };
}
