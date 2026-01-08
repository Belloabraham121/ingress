"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { api } from "@/lib/api";

export interface DepositParams {
  vaultAddress: string;
  tokenAddress: string;
  amount: string; // Amount in token units (will be converted to wei)
  vaultName?: string; // Vault name for activity tracking
  tokenSymbol?: string; // Token symbol for activity tracking
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for depositing tokens into vaults
 *
 * Architecture:
 * - Frontend: Calls backend APIs (no direct blockchain interaction)
 * - Backend: Signs and executes transactions using stored private keys
 * - This is a CUSTODIAL wallet system (backend manages user accounts)
 */
export function useVaultDeposit() {
  const [isDepositing, setIsDepositing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  /**
   * Deposit tokens into a vault
   *
   * Flow:
   * 1. Check current token allowance (backend reads blockchain)
   * 2. Approve tokens if needed (backend signs with user's key)
   * 3. Deposit into vault (backend signs with user's key)
   *
   * @param params - Deposit parameters
   * @returns Deposit result with transaction hash
   */
  const deposit = async ({
    vaultAddress,
    tokenAddress,
    amount,
    vaultName,
    tokenSymbol,
    onSuccess,
    onError,
  }: DepositParams) => {
    setIsDepositing(true);
    setError(null);
    setTxHash(null);

    try {
      console.log("=".repeat(50));
      console.log("VAULT DEPOSIT FLOW (CUSTODIAL)");
      console.log("=".repeat(50));
      console.log("Vault:", vaultAddress);
      console.log("Token:", tokenAddress);
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
        `/api/vault/allowance?tokenAddress=${tokenAddress}&spenderAddress=${vaultAddress}`
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
        }>("/api/vault/sign-approve", {
          tokenAddress,
          spenderAddress: vaultAddress,
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

      // Step 3: Deposit into vault (backend signs transaction)
      console.log("Step 4: Requesting vault deposit...");
      console.log("Backend will sign deposit transaction with user's key");

      const depositResponse = await api.post<{
        transactionHash: string;
        blockNumber: number;
        status: number;
        gasUsed: string;
      }>("/api/vault/sign-deposit", {
        vaultAddress,
        amount: amountWei.toString(),
        vaultName,
        tokenSymbol,
      });

      console.log("✅ Deposit successful!");
      console.log("Transaction ID:", depositResponse.transactionHash);
      console.log(
        `HashScan: https://hashscan.io/testnet/transaction/${depositResponse.transactionHash}`
      );
      console.log("=".repeat(50));
      console.log("");

      setTxHash(depositResponse.transactionHash);

      // Wait for on-chain confirmation then refresh positions
      try {
        const provider = new ethers.JsonRpcProvider(
          "https://testnet.hashio.io/api"
        );
        await provider.waitForTransaction(
          depositResponse.transactionHash,
          1,
          90_000
        );
      } catch {}

      // Dispatch events to refresh activity list and positions
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("activityUpdated"));
        window.dispatchEvent(new Event("positionsUpdated"));
        window.dispatchEvent(new Event("vaultUpdated"));
      }

      if (onSuccess) {
        onSuccess(depositResponse.transactionHash);
      }

      return {
        success: true,
        txHash: depositResponse.transactionHash,
        blockNumber: depositResponse.blockNumber,
      };
    } catch (err: any) {
      console.error("❌ Deposit failed:", err);
      console.error("Error details:", err.response?.data || err.message);
      console.log("=".repeat(50));
      console.log("");

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to deposit into vault";
      setError(errorMessage);

      if (onError) {
        onError(new Error(errorMessage));
      }

      return {
        success: false,
        error: new Error(errorMessage),
      };
    } finally {
      setIsDepositing(false);
    }
  };

  return {
    deposit,
    isDepositing,
    error,
    txHash,
    setError,
  };
}
