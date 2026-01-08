"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { api } from "@/lib/api";

export interface UnstakeParams {
  stakingPoolAddress: string;
  poolId: number;
  amount: string; // Amount in token units (will be converted to wei)
  poolName?: string; // Pool name for activity tracking
  tokenSymbol?: string; // Token symbol for activity tracking
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for withdrawing staked tokens
 */
export function useStakingWithdraw() {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  /**
   * Withdraw (unstake) tokens from a staking pool
   */
  const withdraw = async ({
    stakingPoolAddress,
    poolId,
    amount,
    poolName,
    tokenSymbol,
    onSuccess,
    onError,
  }: UnstakeParams) => {
    setIsWithdrawing(true);
    setError(null);
    setTxHash(null);

    try {
      console.log("=".repeat(50));
      console.log("STAKING WITHDRAWAL FLOW (CUSTODIAL)");
      console.log("=".repeat(50));
      console.log("Staking Pool:", stakingPoolAddress);
      console.log("Pool ID:", poolId);
      console.log("Amount:", amount);
      console.log("");

      // Convert amount to wei (18 decimals)
      const amountWei = ethers.parseUnits(amount, 18);
      console.log("Step 1: Amount converted to wei:", amountWei.toString());
      console.log("");

      // Send withdrawal transaction (backend signs transaction)
      console.log("Step 2: Requesting stake withdrawal...");
      console.log("Backend will sign withdrawal transaction with user's key");

      const withdrawResponse = await api.post<{
        transactionHash: string;
        blockNumber: number;
        status: number;
        gasUsed: string;
      }>("/api/staking/sign-withdraw", {
        stakingPoolAddress,
        poolId,
        amount: amountWei.toString(),
        poolName,
        tokenSymbol,
      });

      console.log("✅ Withdrawal successful!");
      console.log("Transaction ID:", withdrawResponse.transactionHash);
      console.log(
        `HashScan: https://hashscan.io/testnet/transaction/${withdrawResponse.transactionHash}`
      );
      console.log("=".repeat(50));
      console.log("");

      setTxHash(withdrawResponse.transactionHash);

      // Dispatch event to refresh activity list
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("activityUpdated"));
      }

      if (onSuccess) {
        onSuccess(withdrawResponse.transactionHash);
      }

      return {
        success: true,
        txHash: withdrawResponse.transactionHash,
        blockNumber: withdrawResponse.blockNumber,
      };
    } catch (err: any) {
      console.error("❌ Withdrawal failed:", err);
      console.error("Error details:", err.response?.data || err.message);
      console.log("=".repeat(50));
      console.log("");

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to withdraw stake";
      setError(errorMessage);

      if (onError) {
        onError(new Error(errorMessage));
      }

      return {
        success: false,
        error: new Error(errorMessage),
      };
    } finally {
      setIsWithdrawing(false);
    }
  };

  return {
    withdraw,
    isWithdrawing,
    error,
    txHash,
    setError,
  };
}
