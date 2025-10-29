"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

const HEDERA_TESTNET_RPC = "https://testnet.hashio.io/api";

// Deployed vault addresses
const DEPLOYED_VAULTS = [
  {
    address: "0x297375e521c0b864783000279faec4583a167453",
    name: "USDT Vault",
    symbol: "USDT",
    apy: 18,
  },
  {
    address: "0x4f2f9b9b32cd1062c1bc4c02dd7a6b8cd9eeee8c",
    name: "USDC Vault",
    symbol: "USDC",
    apy: 12,
  },
  {
    address: "0xcdeb6cd4b06c026fdd37fcac346b31dc90f6d084",
    name: "DAI Vault",
    symbol: "DAI",
    apy: 15,
  },
];

// RewardVault ABI - only the functions we need
const REWARD_VAULT_ABI = [
  "function getUserInfo(address userAddress) external view returns (uint256 depositAmount, uint256 shares, uint256 pendingRewards, uint256 totalClaimed, uint256 depositTime, uint256 currentValue)",
  "function getUserTotalValue(address userAddress) external view returns (uint256)",
  "function getUserProfit(address userAddress) external view returns (uint256)",
];

export interface UserVaultPosition {
  vaultAddress: string;
  vaultName: string;
  symbol: string;
  apy: number;
  depositAmount: string; // Formatted
  depositAmountRaw: bigint;
  shares: string;
  sharesRaw: bigint;
  pendingRewards: string; // Formatted
  pendingRewardsRaw: bigint;
  totalClaimed: string; // Formatted
  totalClaimedRaw: bigint;
  depositTime: Date;
  currentValue: string; // Formatted (deposit + pending)
  currentValueRaw: bigint;
  projectedAnnualReturn: string; // Formatted total profit
  projectedAnnualReturnRaw: bigint;
}

export interface UserVaultSummary {
  totalDeposited: string;
  totalDepositedRaw: bigint;
  totalCurrentValue: string;
  totalCurrentValueRaw: bigint;
  totalProjectedReturn: string;
  totalProjectedReturnRaw: bigint;
  totalPendingRewards: string;
  totalPendingRewardsRaw: bigint;
  positions: UserVaultPosition[];
}

export function useUserVaultPositions(userEvmAddress?: string) {
  const [positions, setPositions] = useState<UserVaultPosition[]>([]);
  const [summary, setSummary] = useState<UserVaultSummary | null>(null);
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
      const userPositions: UserVaultPosition[] = [];

      // Fetch data from each vault
      for (const vault of DEPLOYED_VAULTS) {
        try {
          const vaultContract = new ethers.Contract(
            vault.address,
            REWARD_VAULT_ABI,
            provider
          );

          // First check if contract exists by checking code
          const code = await provider.getCode(vault.address);
          if (code === "0x") {
            console.warn(
              `Vault ${vault.name} at ${vault.address} has no contract code - skipping`
            );
            continue;
          }

          // Get user info
          const [
            depositAmount,
            shares,
            pendingRewards,
            totalClaimed,
            depositTime,
            currentValue,
          ] = await vaultContract.getUserInfo(userEvmAddress);

          // Only include if user has a position
          if (depositAmount > BigInt(0)) {
            // Get total profit
            const totalProfit = await vaultContract.getUserProfit(
              userEvmAddress
            );

            const position: UserVaultPosition = {
              vaultAddress: vault.address,
              vaultName: vault.name,
              symbol: vault.symbol,
              apy: vault.apy,
              depositAmount: ethers.formatUnits(depositAmount, 18),
              depositAmountRaw: depositAmount,
              shares: ethers.formatUnits(shares, 18),
              sharesRaw: shares,
              pendingRewards: ethers.formatUnits(pendingRewards, 18),
              pendingRewardsRaw: pendingRewards,
              totalClaimed: ethers.formatUnits(totalClaimed, 18),
              totalClaimedRaw: totalClaimed,
              depositTime: new Date(Number(depositTime) * 1000),
              currentValue: ethers.formatUnits(currentValue, 18),
              currentValueRaw: currentValue,
              projectedAnnualReturn: ethers.formatUnits(totalProfit, 18),
              projectedAnnualReturnRaw: totalProfit,
            };

            userPositions.push(position);
          } else {
            console.log(
              `No position in ${vault.name} for user ${userEvmAddress}`
            );
          }
        } catch (vaultError: any) {
          console.warn(
            `Skipping vault ${vault.name} (${vault.address}):`,
            vaultError.message || vaultError
          );
          // Continue with other vaults even if one fails
        }
      }

      // Calculate summary
      const totalDepositedRaw = userPositions.reduce(
        (sum, pos) => sum + pos.depositAmountRaw,
        BigInt(0)
      );
      const totalCurrentValueRaw = userPositions.reduce(
        (sum, pos) => sum + pos.currentValueRaw,
        BigInt(0)
      );
      const totalProjectedReturnRaw = userPositions.reduce(
        (sum, pos) => sum + pos.projectedAnnualReturnRaw,
        BigInt(0)
      );
      const totalPendingRewardsRaw = userPositions.reduce(
        (sum, pos) => sum + pos.pendingRewardsRaw,
        BigInt(0)
      );

      const summaryData: UserVaultSummary = {
        totalDeposited: ethers.formatUnits(totalDepositedRaw, 18),
        totalDepositedRaw,
        totalCurrentValue: ethers.formatUnits(totalCurrentValueRaw, 18),
        totalCurrentValueRaw,
        totalProjectedReturn: ethers.formatUnits(totalProjectedReturnRaw, 18),
        totalProjectedReturnRaw,
        totalPendingRewards: ethers.formatUnits(totalPendingRewardsRaw, 18),
        totalPendingRewardsRaw,
        positions: userPositions,
      };

      setPositions(userPositions);
      setSummary(summaryData);
    } catch (err: any) {
      console.error("Error fetching user vault positions:", err);
      setError(err.message || "Failed to fetch vault positions");
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
