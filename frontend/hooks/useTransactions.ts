"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { TransactionHistory } from "@/types/api";

export function useTransactions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get transaction history with pagination
  const getTransactions = async (page: number = 1, limit: number = 50) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<TransactionHistory>(
        `/api/webhook/transactions?page=${page}&limit=${limit}`
      );
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to fetch transactions");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getTransactions,
    isLoading,
    error,
    setError,
  };
}
