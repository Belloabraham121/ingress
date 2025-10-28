"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type {
  BankAccount,
  CreateBankAccountRequest,
  BalanceResponse,
  RefreshBalanceResponse,
  TransactionHistory,
  InitializePaymentRequest,
  InitializePaymentResponse,
  VerifyPaymentResponse,
} from "@/types/api";

export interface Bank {
  name: string;
  code: string;
  slug: string;
  description: string;
}

export function useBankAccount() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create bank account
  const createBankAccount = async (data: CreateBankAccountRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<BankAccount>(
        "/api/bank-account/create",
        data
      );
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to create bank account");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get bank account details
  const getBankAccountDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<BankAccount>("/api/bank-account/details");
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to fetch bank account details");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get account balance
  const getAccountBalance = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<BalanceResponse>(
        "/api/bank-account/balance"
      );
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to fetch balance");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get available banks
  const getAvailableBanks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<Bank[]>("/api/bank-account/banks");
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to fetch banks");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get transaction history
  const getTransactionHistory = async (
    page: number = 1,
    limit: number = 10
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<TransactionHistory>(
        `/api/webhook/transactions?page=${page}&limit=${limit}`
      );
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to fetch transaction history");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize payment
  const initializePayment = async (data: InitializePaymentRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<InitializePaymentResponse>(
        "/api/payment/initialize",
        data
      );
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to initialize payment");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify payment
  const verifyPayment = async (reference: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<VerifyPaymentResponse>(
        `/api/payment/verify/${reference}`
      );
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to verify payment");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh balance from Paystack (for when webhooks aren't working)
  const refreshBalanceFromPaystack = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<RefreshBalanceResponse>(
        "/api/bank-account/refresh-balance"
      );
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to refresh balance");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Alias for backward compatibility and convenience
  const getBalance = getAccountBalance;
  const refreshBalance = refreshBalanceFromPaystack;

  return {
    createBankAccount,
    getBankAccountDetails,
    getAccountBalance,
    getBalance, // Alias
    getAvailableBanks,
    getTransactionHistory,
    initializePayment,
    verifyPayment,
    refreshBalanceFromPaystack,
    refreshBalance, // Alias
    isLoading,
    error,
    setError,
  };
}
