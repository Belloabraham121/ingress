# Frontend API Integration Guide

Complete guide for using the Ingress API hooks and client functions in your frontend application.

## Table of Contents

1. [Setup](#setup)
2. [Custom Hooks](#custom-hooks)
3. [API Client Functions](#api-client-functions)
4. [Usage Examples](#usage-examples)
5. [Error Handling](#error-handling)
6. [Type Definitions](#type-definitions)

---

## Setup

### Environment Variables

Create a `.env.local` file in your frontend directory:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

For production:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-production-api.com
```

### File Structure

```
frontend/
├── hooks/
│   ├── useAuth.ts          # Authentication hooks
│   ├── useBankAccount.ts   # Bank account hooks
│   └── useTransactions.ts  # Transaction hooks
├── lib/
│   ├── api.ts              # Base API configuration
│   └── api-client.ts       # Direct API functions
└── types/
    └── api.ts              # TypeScript type definitions
```

---

## Custom Hooks

### useAuth Hook

Authentication-related operations.

```typescript
import { useAuth } from "@/hooks/useAuth";

function MyComponent() {
  const { register, login, getProfile, fundWallet, logout, isLoading, error } =
    useAuth();

  // Use the functions...
}
```

**Available Functions:**

| Function     | Description                | Parameters        | Returns              |
| ------------ | -------------------------- | ----------------- | -------------------- |
| `register`   | Register new user          | `RegisterRequest` | `RegisterResponse`   |
| `login`      | Login existing user        | `LoginRequest`    | `LoginResponse`      |
| `getProfile` | Get current user profile   | None              | `ProfileResponse`    |
| `fundWallet` | Fund wallet with 5 HBAR    | None              | `FundWalletResponse` |
| `logout`     | Logout user (clears token) | None              | `void`               |
| `isLoading`  | Loading state              | -                 | `boolean`            |
| `error`      | Error message              | -                 | `string \| null`     |

### useBankAccount Hook

Bank account operations.

```typescript
import { useBankAccount } from "@/hooks/useBankAccount";

function MyComponent() {
  const {
    createBankAccount,
    getBankAccountDetails,
    getBalance,
    getBanks,
    isLoading,
    error,
  } = useBankAccount();

  // Use the functions...
}
```

**Available Functions:**

| Function                | Description            | Parameters                 | Returns           |
| ----------------------- | ---------------------- | -------------------------- | ----------------- |
| `createBankAccount`     | Create virtual account | `CreateBankAccountRequest` | `BankAccount`     |
| `getBankAccountDetails` | Get account details    | None                       | `BankAccount`     |
| `getBalance`            | Get account balance    | None                       | `BalanceResponse` |
| `getBanks`              | Get available banks    | None                       | `Bank[]`          |
| `isLoading`             | Loading state          | -                          | `boolean`         |
| `error`                 | Error message          | -                          | `string \| null`  |

### useTransactions Hook

Transaction operations.

```typescript
import { useTransactions } from "@/hooks/useTransactions";

function MyComponent() {
  const { getTransactions, isLoading, error } = useTransactions();

  // Use the functions...
}
```

**Available Functions:**

| Function          | Description             | Parameters                      | Returns              |
| ----------------- | ----------------------- | ------------------------------- | -------------------- |
| `getTransactions` | Get transaction history | `page?: number, limit?: number` | `TransactionHistory` |
| `isLoading`       | Loading state           | -                               | `boolean`            |
| `error`           | Error message           | -                               | `string \| null`     |

---

## API Client Functions

For direct API calls without hooks (useful for server-side operations):

```typescript
import { authApi, bankAccountApi, transactionApi } from "@/lib/api-client";

// Authentication
const user = await authApi.register({ firstName, lastName, email, password });
const loginData = await authApi.login({ email, password });
const profile = await authApi.getProfile();
const wallet = await authApi.fundWallet();

// Bank Accounts
const account = await bankAccountApi.create({
  bvn,
  firstName,
  lastName,
  phone,
});
const details = await bankAccountApi.getDetails();
const balance = await bankAccountApi.getBalance();
const banks = await bankAccountApi.getBanks();

// Transactions
const history = await transactionApi.getHistory(1, 50);
```

---

## Usage Examples

### 1. User Registration

```typescript
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function SignupPage() {
  const { register, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await register(formData);
      console.log("User registered:", response.user);
      console.log("Wallet created:", response.wallet);

      // Redirect to dashboard or next step
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="First Name"
        value={formData.firstName}
        onChange={(e) =>
          setFormData({ ...formData, firstName: e.target.value })
        }
      />
      <input
        type="text"
        placeholder="Last Name"
        value={formData.lastName}
        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Sign Up"}
      </button>
    </form>
  );
}
```

### 2. User Login

```typescript
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await login({ email, password });
      console.log("Logged in as:", response.user);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
```

### 3. Get User Profile

```typescript
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { getProfile, isLoading, error } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return null;

  return (
    <div>
      <h1>
        {profile.user.firstName} {profile.user.lastName}
      </h1>
      <p>Email: {profile.user.email}</p>
      <p>Wallet ID: {profile.wallet.accountId}</p>
      <p>Balance: {profile.wallet.balance} HBAR</p>
      <p>
        Status: {profile.wallet.isActivated ? "Activated" : "Not Activated"}
      </p>
    </div>
  );
}
```

### 4. Create Bank Account

```typescript
"use client";

import { useState } from "react";
import { useBankAccount } from "@/hooks/useBankAccount";

export default function CreateBankAccountPage() {
  const { createBankAccount, isLoading, error } = useBankAccount();
  const [formData, setFormData] = useState({
    bvn: "",
    firstName: "",
    lastName: "",
    phone: "",
    preferredBank: "test-bank" as const, // Use test-bank for testing
  });
  const [account, setAccount] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await createBankAccount(formData);
      setAccount(response);
      console.log("Bank account created:", response);
    } catch (err) {
      console.error("Failed to create account:", err);
    }
  };

  if (account) {
    return (
      <div>
        <h2>Bank Account Created Successfully!</h2>
        <p>Account Number: {account.accountNumber}</p>
        <p>Account Name: {account.accountName}</p>
        <p>Bank: {account.bankName}</p>
        <p>Instructions: {account.instructions}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="BVN (11 digits)"
        value={formData.bvn}
        onChange={(e) => setFormData({ ...formData, bvn: e.target.value })}
        maxLength={11}
      />
      <input
        type="text"
        placeholder="First Name"
        value={formData.firstName}
        onChange={(e) =>
          setFormData({ ...formData, firstName: e.target.value })
        }
      />
      <input
        type="text"
        placeholder="Last Name"
        value={formData.lastName}
        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
      />
      <input
        type="tel"
        placeholder="Phone (08012345678)"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
      />

      <select
        value={formData.preferredBank}
        onChange={(e) =>
          setFormData({
            ...formData,
            preferredBank: e.target.value as
              | "test-bank"
              | "wema-bank"
              | "titan-paystack",
          })
        }
      >
        <option value="test-bank">Test Bank (Testing Only)</option>
        <option value="wema-bank" disabled>
          Wema Bank (Production)
        </option>
        <option value="titan-paystack" disabled>
          Titan (Production)
        </option>
      </select>
      <p>Use "test-bank" for testing with test API keys</p>

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create Bank Account"}
      </button>
    </form>
  );
}
```

### 5. Get Transaction History

```typescript
"use client";

import { useEffect, useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";

export default function TransactionsPage() {
  const { getTransactions, isLoading, error } = useTransactions();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadTransactions(currentPage);
  }, [currentPage]);

  const loadTransactions = async (page: number) => {
    try {
      const data = await getTransactions(page, 10);
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    }
  };

  if (isLoading) return <div>Loading transactions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Transaction History</h1>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Reference</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx._id}>
              <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
              <td>{tx.reference}</td>
              <td>
                {tx.amount} {tx.currency}
              </td>
              <td>{tx.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && (
        <div>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage >= pagination.pages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

### 6. Get Account Balance with Auto-Refresh

```typescript
"use client";

import { useEffect, useState } from "react";
import { useBankAccount } from "@/hooks/useBankAccount";

export default function BalancePage() {
  const { getBalance, isLoading } = useBankAccount();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    // Load initial balance
    loadBalance();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadBalance, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadBalance = async () => {
    try {
      const data = await getBalance();
      setBalance(data);
    } catch (err) {
      console.error("Failed to load balance:", err);
    }
  };

  return (
    <div>
      <h2>Account Balance</h2>
      {balance ? (
        <p>
          {balance.balance.toLocaleString()} {balance.currency}
        </p>
      ) : (
        <p>Loading...</p>
      )}
      <button onClick={loadBalance} disabled={isLoading}>
        {isLoading ? "Refreshing..." : "Refresh Balance"}
      </button>
    </div>
  );
}
```

---

## Error Handling

All hooks and API functions throw errors that can be caught:

```typescript
try {
  const response = await register(formData);
  // Success handling
} catch (error) {
  if (error instanceof ApiError) {
    console.error("API Error:", error.message);
    console.error("Status Code:", error.statusCode);
    console.error("Details:", error.errors);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### Common Error Messages

| Error Message                         | Meaning                     | Solution                       |
| ------------------------------------- | --------------------------- | ------------------------------ |
| "User with this email already exists" | Email is already registered | Use a different email or login |
| "Invalid email or password"           | Wrong credentials           | Check email and password       |
| "Not authorized to access this route" | No or invalid token         | Login again                    |
| "You already have a bank account"     | Bank account exists         | Use existing account           |
| "Invalid BVN format"                  | BVN not 11 digits           | Provide valid 11-digit BVN     |
| "Network error"                       | Connection issues           | Check internet connection      |

---

## Type Definitions

All TypeScript types are defined in `/types/api.ts`. Here are the main types:

### User

```typescript
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}
```

### Wallet

```typescript
interface Wallet {
  accountId: string;
  evmAddress: string;
  isActivated: boolean;
  balance: number;
  activationRequired?: string | number;
}
```

### BankAccount

```typescript
interface BankAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
  currency: string;
  balance?: number;
  isActive: boolean;
  createdAt?: string;
  instructions?: string;
}
```

### Transaction

```typescript
interface Transaction {
  _id: string;
  reference: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed";
  channel: string;
  paidAt?: string;
  createdAt: string;
}
```

---

## Best Practices

1. **Always handle errors gracefully** - Display user-friendly messages
2. **Store tokens securely** - Consider httpOnly cookies for production
3. **Validate input on the frontend** - Don't rely solely on backend validation
4. **Use loading states** - Provide feedback to users during API calls
5. **Implement retry logic** - For failed network requests
6. **Clear sensitive data** - On logout or errors
7. **Use environment variables** - Never hardcode API URLs

---

## Testing

To test the API integration:

1. Start the backend server: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Open http://localhost:3000 (frontend)
4. Try registration, login, and other features

---

## Support

For issues or questions:

- Backend API Documentation: `/backend/API_DOCUMENTATION.md`
- Backend Setup Guide: `/backend/SETUP_GUIDE.md`
- Paystack Documentation: https://paystack.com/docs
- Hedera Documentation: https://docs.hedera.com

---

**Last Updated**: January 28, 2025  
**Version**: 1.0.0
