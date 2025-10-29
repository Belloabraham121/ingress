"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { api } from "@/lib/api";

export interface StakeParams {
  stakingPoolAddress: string;
  tokenAddress: string;
  poolId: number;
  amount: string; // Amount in token units (will be converted to wei)
  poolName?: string; // Pool name for activity tracking
  tokenSymbol?: string; // Token symbol for activity tracking
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for staking tokens
 *
 * Architecture:
 * - Frontend: Calls backend APIs (no direct blockchain interaction)
 * - Backend: Signs and executes transactions using stored private keys
 * - This is a CUSTODIAL wallet system (backend manages user accounts)
 */
export function useStakingDeposit() {
  const [isStaking, setIsStaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  /**
   * Stake tokens in a staking pool
   *
   * Flow:
   * 1. Check current token allowance (backend reads blockchain)
   * 2. Approve tokens if needed (backend signs with user's key)
   * 3. Stake in pool (backend signs with user's key)
   *
   * @param params - Stake parameters
   * @returns Stake result with transaction hash
   */
  const stake = async ({
    stakingPoolAddress,
    tokenAddress,
    poolId,
    amount,
    poolName,
    tokenSymbol,
    onSuccess,
    onError,
  }: StakeParams) => {
    setIsStaking(true);
    setError(null);
    setTxHash(null);

    try {
      console.log("=".repeat(50));
      console.log("STAKING FLOW (CUSTODIAL)");
      console.log("=".repeat(50));
      console.log("Staking Pool:", stakingPoolAddress);
      console.log("Token:", tokenAddress);
      console.log("Pool ID:", poolId);
      console.log("Amount:", amount);
      console.log("");

      // Convert amount to wei (18 decimals)
      const amountWei = ethers.parseUnits(amount, 18);
      console.log("Step 1: Amount converted to wei:", amountWei.toString());
      console.log("");

      // Step 1: Check current allowance (backend reads from blockchain)
      console.log("Step 2: Checking token allowance via backend...");
      const allowanceResponse = await api.get<{
        allowance: string;
        formattedAllowance: string;
      }>(
        `/api/staking/allowance?tokenAddress=${tokenAddress}&spenderAddress=${stakingPoolAddress}`
      );

      const currentAllowance = BigInt(allowanceResponse.allowance);
      console.log(`Current allowance: ${allowanceResponse.formattedAllowance}`);
      console.log("");

      // Step 2: Approve tokens if needed (backend signs transaction)
      if (currentAllowance < amountWei) {
        console.log("Step 3: Insufficient allowance - requesting approval...");
        console.log("Backend will sign approval transaction with user's key");

        const approveResponse = await api.post<{
          transactionHash: string;
          blockNumber: number;
          status: number;
          gasUsed: string;
        }>("/api/staking/sign-approve", {
          tokenAddress,
          spenderAddress: stakingPoolAddress,
          amount: amountWei.toString(),
        });

        console.log("✅ Approval successful!");
        console.log("Transaction ID:", approveResponse.transactionHash);
        console.log(
          `HashScan: https://hashscan.io/testnet/transaction/${approveResponse.transactionHash}`
        );
        console.log("");
      } else {
        console.log("Step 3: Sufficient allowance exists - skipping approval");
        console.log("");
      }

      // Step 3: Stake in pool (backend signs transaction)
      console.log("Step 4: Requesting stake...");
      console.log("Backend will sign stake transaction with user's key");

      const stakeResponse = await api.post<{
        transactionHash: string;
        blockNumber: number;
        status: number;
        gasUsed: string;
      }>("/api/staking/sign-stake", {
        stakingPoolAddress,
        poolId,
        amount: amountWei.toString(),
        poolName,
        tokenSymbol,
      });

      console.log("✅ Stake successful!");
      console.log("Transaction ID:", stakeResponse.transactionHash);
      console.log(
        `HashScan: https://hashscan.io/testnet/transaction/${stakeResponse.transactionHash}`
      );
      console.log("=".repeat(50));
      console.log("");

      setTxHash(stakeResponse.transactionHash);

      // Dispatch event to refresh activity list
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("activityUpdated"));
      }

      if (onSuccess) {
        onSuccess(stakeResponse.transactionHash);
      }

      return {
        success: true,
        txHash: stakeResponse.transactionHash,
        blockNumber: stakeResponse.blockNumber,
      };
    } catch (err: any) {
      console.error("❌ Stake failed:", err);
      console.error("Error details:", err.response?.data || err.message);
      console.log("=".repeat(50));
      console.log("");

      const errorMessage =
        err.response?.data?.message || err.message || "Failed to stake";
      setError(errorMessage);

      if (onError) {
        onError(new Error(errorMessage));
      }

      return {
        success: false,
        error: new Error(errorMessage),
      };
    } finally {
      setIsStaking(false);
    }
  };

  return {
    stake,
    isStaking,
    error,
    txHash,
    setError,
  };
}
