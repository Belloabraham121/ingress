// Convenience API client functions for direct use without hooks

import { api } from "./api";
import type {
  RegisterRequest,
  LoginRequest,
  RegisterResponse,
  LoginResponse,
  ProfileResponse,
  FundWalletResponse,
  CreateBankAccountRequest,
  BankAccount,
  Bank,
  BalanceResponse,
  RefreshBalanceResponse,
  TransactionHistory,
  SendHbarRequest,
  SendHbarResponse,
  TransferHbarRequest,
  TransferHbarResponse,
  WalletBalanceResponse,
} from "@/types/api";

// ============ Authentication API ============

export const authApi = {
  /**
   * Register a new user
   */
  register: (data: RegisterRequest) =>
    api.post<RegisterResponse>("/api/auth/register", data),

  /**
   * Login user
   */
  login: (data: LoginRequest) =>
    api.post<LoginResponse>("/api/auth/login", data),

  /**
   * Get current user profile
   */
  getProfile: () => api.get<ProfileResponse>("/api/auth/me"),

  /**
   * Fund wallet with 5 HBAR to activate
   */
  fundWallet: () => api.post<FundWalletResponse>("/api/auth/fund-wallet"),

  /**
   * Send HBAR to your wallet
   */
  sendHbar: (data: SendHbarRequest) =>
    api.post<SendHbarResponse>("/api/auth/send-hbar", data),

  /**
   * Transfer HBAR to another account
   */
  transferHbar: (data: TransferHbarRequest) =>
    api.post<TransferHbarResponse>("/api/auth/transfer-hbar", data),

  /**
   * Get wallet balance
   */
  getWalletBalance: () =>
    api.get<WalletBalanceResponse>("/api/auth/wallet-balance"),
};

// ============ Bank Account API ============

export const bankAccountApi = {
  /**
   * Create a dedicated virtual bank account
   */
  create: (data: CreateBankAccountRequest) =>
    api.post<BankAccount>("/api/bank-account/create", data),

  /**
   * Get bank account details
   */
  getDetails: () => api.get<BankAccount>("/api/bank-account/details"),

  /**
   * Get account balance
   */
  getBalance: () => api.get<BalanceResponse>("/api/bank-account/balance"),

  /**
   * Get available banks
   */
  getBanks: () => api.get<Bank[]>("/api/bank-account/banks"),

  /**
   * Manually refresh balance from Paystack
   */
  refreshBalance: () =>
    api.post<RefreshBalanceResponse>("/api/bank-account/refresh-balance"),

  /**
   * Internal NGN transfer between users by Hedera Account ID
   */
  transfer: (toAccountId: string, amount: number) =>
    api.post<{ message: string }>("/api/bank-account/transfer", {
      toAccountId,
      amount,
    }),
};

// ============ Transaction API ============

export const transactionApi = {
  /**
   * Get transaction history with pagination
   */
  getHistory: (page: number = 1, limit: number = 50) =>
    api.get<TransactionHistory>(
      `/api/webhook/transactions?page=${page}&limit=${limit}`
    ),
};

// ============ Wallet API ============

export const walletApi = {
  /**
   * Resolve Hedera account ID to user display name
   */
  resolveAccountId: (accountId: string) =>
    api.get<{ accountId: string; userId: string; name?: string }>(
      `/api/wallet/resolve/${encodeURIComponent(accountId)}`
    ),
};

// ============ Health Check ============

export const healthApi = {
  /**
   * Check if API server is running
   */
  check: () =>
    api.get<{ success: boolean; message: string; version: string }>("/"),
};
