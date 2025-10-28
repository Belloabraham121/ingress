// API Response Types

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// User Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Wallet Types
export interface Wallet {
  accountId: string;
  evmAddress: string;
  isActivated: boolean;
  balance: number;
  activationRequired?: string | number;
}

// Auth Response Types
export interface RegisterResponse {
  token: string;
  user: User;
  wallet: Wallet;
}

export interface LoginResponse {
  token: string;
  user: User;
  wallet: Wallet;
}

export interface ProfileResponse {
  user: User;
  wallet: Wallet;
}

export interface FundWalletResponse {
  txId: string;
  wallet: Wallet;
}

// Bank Account Types
export interface BankAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
  currency: string;
  balance?: number;
  isActive: boolean;
  createdAt?: string;
  instructions?: string;
}

export interface Bank {
  name: string;
  code: string;
  slug: string;
}

// Transaction Types
export interface Transaction {
  _id: string;
  reference: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed";
  channel: string;
  paidAt?: string;
  createdAt: string;
}

export interface TransactionHistory {
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Request Types
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateBankAccountRequest {
  bvn: string;
  firstName: string;
  lastName: string;
  phone: string;
  preferredBank?: "test-bank" | "wema-bank" | "titan-paystack";
}

export interface BalanceResponse {
  balance: number;
  currency: string;
}

export interface RefreshBalanceResponse {
  oldBalance: number;
  newBalance: number;
  difference: number;
  transactionsFound: number;
  currency: string;
}

// HBAR Transfer Types
export interface SendHbarRequest {
  amount: string;
}

export interface SendHbarResponse {
  txId: string;
  wallet: Wallet;
}

export interface TransferHbarRequest {
  toAccountId: string;
  amount: string;
}

export interface TransferHbarResponse {
  txId: string;
  from: string;
  to: string;
  amount: string;
  newBalance: number;
}

export interface WalletBalanceResponse {
  accountId: string;
  evmAddress: string;
  balance: number;
  balanceString: string;
  isActivated: boolean;
}

// Payment Types
export interface InitializePaymentRequest {
  amount: string;
  currency?: string;
}

export interface InitializePaymentResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface VerifyPaymentResponse {
  reference: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string;
  newBalance: number;
  channel: string;
}

export interface RefreshBalanceResponse {
  oldBalance: number;
  newBalance: number;
  difference: number;
  transactionsFound: number;
  transactionsSaved: number;
  currency: string;
}
