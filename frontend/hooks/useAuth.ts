"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken, removeToken } from "@/lib/api";
import type {
  RegisterRequest,
  LoginRequest,
  RegisterResponse,
  LoginResponse,
  ProfileResponse,
  FundWalletResponse,
  SendHbarRequest,
  SendHbarResponse,
  TransferHbarRequest,
  TransferHbarResponse,
  WalletBalanceResponse,
} from "@/types/api";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Register user
  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<RegisterResponse>(
        "/api/auth/register",
        data
      );

      // Store token
      setToken(response.token);

      return response;
    } catch (err: any) {
      setError(err.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Login user
  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<LoginResponse>("/api/auth/login", data);

      // Store token
      setToken(response.token);

      return response;
    } catch (err: any) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get current user profile
  const getProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<ProfileResponse>("/api/auth/me");
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to fetch profile");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fund wallet (activate)
  const fundWallet = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<FundWalletResponse>(
        "/api/auth/fund-wallet"
      );
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to fund wallet");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Send HBAR to your wallet
  const sendHbar = async (amount: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<SendHbarResponse>("/api/auth/send-hbar", {
        amount,
      });
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to send HBAR");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Transfer HBAR to another account
  const transferHbar = async (toAccountId: string, amount: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<TransferHbarResponse>(
        "/api/auth/transfer-hbar",
        {
          toAccountId,
          amount,
        }
      );
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to transfer HBAR");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get wallet balance
  const getWalletBalance = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<WalletBalanceResponse>(
        "/api/auth/wallet-balance"
      );
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to get wallet balance");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    removeToken();
    router.push("/signin");
  };

  return {
    register,
    login,
    getProfile,
    fundWallet,
    sendHbar,
    transferHbar,
    getWalletBalance,
    logout,
    isLoading,
    error,
    setError,
  };
}
