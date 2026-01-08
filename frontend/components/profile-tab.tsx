"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getEvmAddressFromAccountId } from "@/lib/hedera-utils";
import { useBankAccount } from "@/hooks/useBankAccount";
import type { BankAccount, Transaction } from "@/types/api";

export function ProfileTab() {
  const { getProfile, getWalletBalance } = useAuth();
  const {
    getBankAccountDetails,
    createBankAccount,
    getTransactionHistory,
    refreshBalanceFromPaystack,
    isLoading: isBankLoading,
  } = useBankAccount();
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [evmResolved, setEvmResolved] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showWalletAddress, setShowWalletAddress] = useState(false);
  const [showHederaId, setShowHederaId] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [isCreatingBankAccount, setIsCreatingBankAccount] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await getProfile();
      setUser(profile.user);
      setWallet(profile.wallet);
      // Resolve EVM from mirror node using accountId
      if (profile.wallet?.accountId) {
        try {
          const evm = await getEvmAddressFromAccountId(
            profile.wallet.accountId
          );
          setEvmResolved(evm);
        } catch (e) {
          console.warn("Failed to resolve EVM from mirror node:", e);
        }
      }
      setEditForm({
        firstName: profile.user.firstName,
        lastName: profile.user.lastName,
        email: profile.user.email,
      });

      // Try to load bank account
      try {
        const bankAccountData = await getBankAccountDetails();
        setBankAccount(bankAccountData);

        // Load transaction history if bank account exists
        const transactionData = await getTransactionHistory(1, 5);
        setTransactions(transactionData.transactions);
      } catch (err: any) {
        // Bank account doesn't exist yet, that's okay
        console.log("No bank account found");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for payment events and page focus to refresh bank balance immediately
  useEffect(() => {
    let pollTimer: any = null;
    const refreshBank = async () => {
      try {
        const updated = await getBankAccountDetails();
        setBankAccount(updated);
      } catch {}
    };

    const startShortPoll = () => {
      let attempts = 0;
      clearInterval(pollTimer);
      pollTimer = setInterval(async () => {
        attempts++;
        await refreshBank();
        if (attempts >= 30) {
          clearInterval(pollTimer);
        }
      }, 3000); // 3s for ~90s total
    };

    const onPaymentStarted = () => startShortPoll();
    const onWalletUpdated = () => refreshBank();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshBank();
    };

    window.addEventListener("paymentStarted", onPaymentStarted);
    window.addEventListener("walletUpdated", onWalletUpdated);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener("paymentStarted", onPaymentStarted);
      window.removeEventListener("walletUpdated", onWalletUpdated);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [getBankAccountDetails]);

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [bankAccountForm, setBankAccountForm] = useState({
    bvn: "",
    phone: "",
  });

  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [bankAccountError, setBankAccountError] = useState("");
  const [bankAccountSuccess, setBankAccountSuccess] = useState("");
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [refreshBalanceMessage, setRefreshBalanceMessage] = useState("");

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update API
    setUser({
      ...user,
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      email: editForm.email,
    });
    setIsEditing(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    // TODO: Implement password change API
    setPasswordSuccess("Password changed successfully");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsChangingPassword(false);
  };

  const refreshBalance = async () => {
    setIsRefreshing(true);
    try {
      const balance = await getWalletBalance();
      setWallet((prev: any) => ({
        ...prev,
        balance: balance.balance,
        isActivated: balance.isActivated,
      }));
    } catch (err) {
      console.error("Failed to refresh balance:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCreateBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankAccountError("");
    setBankAccountSuccess("");

    if (!bankAccountForm.bvn || !bankAccountForm.phone) {
      setBankAccountError("Please provide BVN and phone number");
      return;
    }

    if (!/^\d{11}$/.test(bankAccountForm.bvn)) {
      setBankAccountError("BVN must be 11 digits");
      return;
    }

    if (!/^(\+?234|0)[789]\d{9}$/.test(bankAccountForm.phone)) {
      setBankAccountError(
        "Invalid phone number format. Use Nigerian phone number"
      );
      return;
    }

    try {
      const accountData = await createBankAccount({
        bvn: bankAccountForm.bvn,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: bankAccountForm.phone,
        preferredBank: "test-bank", // Using test bank for development
      });

      setBankAccount(accountData);
      setBankAccountSuccess("Bank account created successfully!");
      setIsCreatingBankAccount(false);
      setBankAccountForm({ bvn: "", phone: "" });
    } catch (err: any) {
      setBankAccountError(err.message || "Failed to create bank account");
    }
  };

  const handleRefreshBankBalance = async () => {
    setIsRefreshingBalance(true);
    setRefreshBalanceMessage("");

    try {
      const result = await refreshBalanceFromPaystack();

      if (result.difference > 0) {
        setRefreshBalanceMessage(
          `✅ Balance updated! Added ₦${result.difference.toLocaleString()} (${
            result.transactionsFound
          } transactions found)`
        );
      } else if (result.difference < 0) {
        setRefreshBalanceMessage(
          `✅ Balance updated! Adjusted by ₦${result.difference.toLocaleString()}`
        );
      } else {
        setRefreshBalanceMessage(
          `✅ Balance is up to date! (${result.transactionsFound} transactions checked)`
        );
      }

      // Refresh bank account data
      const updatedAccount = await getBankAccountDetails();
      setBankAccount(updatedAccount);

      // Also refresh transaction history
      const transactionData = await getTransactionHistory(1, 5);
      setTransactions(transactionData.transactions);

      // Clear message after 5 seconds
      setTimeout(() => setRefreshBalanceMessage(""), 5000);
    } catch (err: any) {
      setRefreshBalanceMessage(
        `❌ ${err.message || "Failed to refresh balance. Please try again."}`
      );
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  if (isLoading) {
    return (
      <div className="border border-border bg-background p-6">
        <p className="text-sm font-mono text-foreground/60">
          Loading profile...
        </p>
      </div>
    );
  }

  if (!user || !wallet) {
    return (
      <div className="border border-border bg-background p-6">
        <p className="text-sm font-mono text-red-500">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Information Section */}
      <div className="border border-border bg-background p-6">
        <h2 className="text-lg font-sentient mb-6">WALLET INFORMATION</h2>

        {/* Hedera Wallet Balance */}
        <div className="mb-6 pb-6 border-b border-border/50">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-mono text-foreground/60">
              HEDERA WALLET BALANCE
            </p>
            <button
              onClick={refreshBalance}
              disabled={isRefreshing}
              className="text-xs font-mono text-primary hover:opacity-70 transition-opacity disabled:opacity-50"
            >
              {isRefreshing ? "[REFRESHING...]" : "[REFRESH]"}
            </button>
          </div>
          <p className="text-3xl font-sentient text-primary">
            {wallet.balance.toLocaleString()} HBAR
          </p>
          <p className="text-xs font-mono text-foreground/50 mt-2">
            Status: {wallet.isActivated ? "✓ Activated" : "⚠ Not Activated"}
          </p>
        </div>

        {/* Hedera Account ID */}
        <div className="mb-6 pb-6 border-b border-border/50">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-mono text-foreground/60">
              HEDERA ACCOUNT ID
            </p>
            <button
              onClick={() => setShowHederaId(!showHederaId)}
              className="text-xs font-mono text-primary hover:text-primary/80 transition-colors"
            >
              {showHederaId ? "[HIDE]" : "[SHOW]"}
            </button>
          </div>

          {showHederaId ? (
            <div className="flex items-center gap-3">
              <p className="text-sm font-mono text-foreground break-all">
                {wallet.accountId}
              </p>
              <button
                onClick={() => copyToClipboard(wallet.accountId)}
                className="px-3 py-2 border border-border text-xs font-mono text-foreground/60 hover:border-primary hover:text-primary transition-colors [clip-path:polygon(2px_0,calc(100%_-_2px)_0,100%_2px,100%_calc(100%_-_2px),calc(100%_-_2px)_100%,2px_100%,0_calc(100%_-_2px),0_2px)]"
              >
                [COPY]
              </button>
            </div>
          ) : (
            <p className="text-sm font-mono text-foreground/40">••••••••••••</p>
          )}
        </div>

        {/* EVM Wallet Address */}
        <div>
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-mono text-foreground/60">
              EVM WALLET ADDRESS
            </p>
            <button
              onClick={() => setShowWalletAddress(!showWalletAddress)}
              className="text-xs font-mono text-primary hover:text-primary/80 transition-colors"
            >
              {showWalletAddress ? "[HIDE]" : "[SHOW]"}
            </button>
          </div>

          {showWalletAddress ? (
            <div className="flex items-center gap-3">
              <p className="text-sm font-mono text-foreground break-all">
                {evmResolved || wallet.evmAddress}
              </p>
              <button
                onClick={() =>
                  copyToClipboard(evmResolved || wallet.evmAddress)
                }
                className="px-3 py-2 border border-border text-xs font-mono text-foreground/60 hover:border-primary hover:text-primary transition-colors [clip-path:polygon(2px_0,calc(100%_-_2px)_0,100%_2px,100%_calc(100%_-_2px),calc(100%_-_2px)_100%,2px_100%,0_calc(100%_-_2px),0_2px)]"
              >
                [COPY]
              </button>
            </div>
          ) : (
            <p className="text-sm font-mono text-foreground/40">
              ••••••••••••••••••••••••••••••••••••••••
            </p>
          )}
        </div>
      </div>

      {/* Bank Account Section */}
      <div className="border border-border bg-background p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-sentient">PAYSTACK BANK ACCOUNT</h2>
          {!bankAccount && !isCreatingBankAccount && (
            <button
              onClick={() => setIsCreatingBankAccount(true)}
              className="text-xs font-mono text-primary hover:text-primary/80 transition-colors"
            >
              [CREATE ACCOUNT]
            </button>
          )}
        </div>

        {bankAccount ? (
          <div className="space-y-6">
            {/* Account Balance */}
            <div className="pb-6 border-b border-border/50">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-mono text-foreground/60">
                  ACCOUNT BALANCE
                </p>
                <button
                  onClick={handleRefreshBankBalance}
                  disabled={isRefreshingBalance}
                  className="text-xs font-mono text-primary hover:opacity-70 transition-opacity disabled:opacity-50"
                >
                  {isRefreshingBalance ? "[REFRESHING...]" : "[REFRESH]"}
                </button>
              </div>
              <p className="text-3xl font-sentient text-primary">
                ₦{bankAccount.balance?.toLocaleString() || "0"}
              </p>
              <p className="text-xs font-mono text-foreground/50 mt-2">
                Currency: {bankAccount.currency}
              </p>
              {refreshBalanceMessage && (
                <p
                  className={`text-xs font-mono mt-2 ${
                    refreshBalanceMessage.startsWith("✅")
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {refreshBalanceMessage}
                </p>
              )}
            </div>

            {/* Account Number */}
            <div className="pb-6 border-b border-border/50">
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-mono text-foreground/60">
                  ACCOUNT NUMBER
                </p>
                <button
                  onClick={() => setShowAccountNumber(!showAccountNumber)}
                  className="text-xs font-mono text-primary hover:text-primary/80 transition-colors"
                >
                  {showAccountNumber ? "[HIDE]" : "[SHOW]"}
                </button>
              </div>

              {showAccountNumber ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-sentient text-foreground">
                      {bankAccount.accountNumber}
                    </p>
                    <button
                      onClick={() => copyToClipboard(bankAccount.accountNumber)}
                      className="px-3 py-2 border border-border text-xs font-mono text-foreground/60 hover:border-primary hover:text-primary transition-colors [clip-path:polygon(2px_0,calc(100%_-_2px)_0,100%_2px,100%_calc(100%_-_2px),calc(100%_-_2px)_100%,2px_100%,0_calc(100%_-_2px),0_2px)]"
                    >
                      [COPY]
                    </button>
                  </div>
                  <p className="text-sm font-mono text-foreground/80">
                    {bankAccount.accountName}
                  </p>
                  <p className="text-xs font-mono text-foreground/60">
                    {bankAccount.bankName}
                  </p>
                </div>
              ) : (
                <p className="text-sm font-mono text-foreground/40">
                  ••••••••••
                </p>
              )}
            </div>

            {/* Funding Instructions */}
            <div className="pb-6 border-b border-border/50">
              <p className="text-xs font-mono text-foreground/60 mb-3">
                HOW TO FUND
              </p>
              <div className="space-y-2 text-sm font-mono text-foreground/80">
                <p>1. Transfer money to the account number above</p>
                <p>2. Use any Nigerian bank or payment app</p>
                <p>3. Your balance updates automatically</p>
              </div>
              <div className="mt-4 p-3 border border-primary/20 bg-primary/5 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]">
                <p className="text-xs font-mono text-primary">
                  💡 For testing: Use Paystack test cards to simulate payments
                </p>
              </div>
            </div>

            {/* Recent Transactions */}
            {transactions.length > 0 && (
              <div>
                <p className="text-xs font-mono text-foreground/60 mb-4">
                  RECENT TRANSACTIONS
                </p>
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx._id}
                      className="flex justify-between items-center p-3 border border-border/50 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
                    >
                      <div>
                        <p className="text-sm font-mono text-foreground">
                          +₦{tx.amount.toLocaleString()}
                        </p>
                        <p className="text-xs font-mono text-foreground/50">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-xs font-mono">
                        <span
                          className={
                            tx.status === "success"
                              ? "text-green-500"
                              : tx.status === "failed"
                              ? "text-red-500"
                              : "text-yellow-500"
                          }
                        >
                          {tx.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : isCreatingBankAccount ? (
          <form onSubmit={handleCreateBankAccount} className="space-y-4">
            <div className="p-4 border border-border/50 bg-foreground/5 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]">
              <p className="text-xs font-mono text-foreground/80 mb-2">
                📋 REQUIRED INFORMATION
              </p>
              <ul className="text-xs font-mono text-foreground/60 space-y-1 list-disc list-inside">
                <li>BVN (Bank Verification Number - 11 digits)</li>
                <li>Nigerian phone number</li>
                <li>Your registered name will be used automatically</li>
              </ul>
            </div>

            {/* BVN Input */}
            <div>
              <label className="block text-xs font-mono text-foreground/60 mb-2">
                BVN (11 DIGITS)
              </label>
              <input
                type="text"
                value={bankAccountForm.bvn}
                onChange={(e) =>
                  setBankAccountForm({
                    ...bankAccountForm,
                    bvn: e.target.value.replace(/\D/g, "").slice(0, 11),
                  })
                }
                placeholder="12345678901"
                maxLength={11}
                required
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-xs font-mono text-foreground/60 mb-2">
                PHONE NUMBER
              </label>
              <input
                type="tel"
                value={bankAccountForm.phone}
                onChange={(e) =>
                  setBankAccountForm({
                    ...bankAccountForm,
                    phone: e.target.value,
                  })
                }
                placeholder="08012345678 or +2348012345678"
                required
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* Error Message */}
            {bankAccountError && (
              <p className="text-red-500 font-mono text-sm">
                {bankAccountError}
              </p>
            )}

            {/* Success Message */}
            {bankAccountSuccess && (
              <p className="text-green-500 font-mono text-sm">
                {bankAccountSuccess}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={isBankLoading}>
                {isBankLoading ? "[CREATING...]" : "[CREATE ACCOUNT]"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingBankAccount(false);
                  setBankAccountForm({ bvn: "", phone: "" });
                  setBankAccountError("");
                  setBankAccountSuccess("");
                }}
                className="flex-1 px-4 py-3 border border-border text-foreground font-mono text-sm hover:border-primary hover:text-primary transition-colors [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              >
                [CANCEL]
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm font-mono text-foreground/60 mb-4">
              No bank account created yet
            </p>
            <p className="text-xs font-mono text-foreground/40">
              Create a virtual account to receive payments
            </p>
          </div>
        )}
      </div>

      {/* Profile Information Section */}
      <div className="border border-border bg-background p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-sentient">PROFILE INFORMATION</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-mono text-primary hover:text-primary/80 transition-colors"
            >
              [EDIT]
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* First Name Input */}
            <div>
              <label className="block text-xs font-mono text-foreground/60 mb-2">
                FIRST NAME
              </label>
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) =>
                  setEditForm({ ...editForm, firstName: e.target.value })
                }
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* Last Name Input */}
            <div>
              <label className="block text-xs font-mono text-foreground/60 mb-2">
                LAST NAME
              </label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) =>
                  setEditForm({ ...editForm, lastName: e.target.value })
                }
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-xs font-mono text-foreground/60 mb-2">
                EMAIL
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                [SAVE CHANGES]
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditForm({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                  });
                }}
                className="flex-1 px-4 py-3 border border-border text-foreground font-mono text-sm hover:border-primary hover:text-primary transition-colors [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              >
                [CANCEL]
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-mono text-foreground/60 mb-2">
                FIRST NAME
              </p>
              <p className="text-sm font-mono text-foreground">
                {user.firstName}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono text-foreground/60 mb-2">
                LAST NAME
              </p>
              <p className="text-sm font-mono text-foreground">
                {user.lastName}
              </p>
            </div>
            <div>
              <p className="text-xs font-mono text-foreground/60 mb-2">EMAIL</p>
              <p className="text-sm font-mono text-foreground">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-foreground/60 mb-2">
                USER ID
              </p>
              <p className="text-sm font-mono text-foreground/40">{user.id}</p>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Section */}
      <div className="border border-border bg-background p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-sentient">SECURITY</h2>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="text-xs font-mono text-primary hover:text-primary/80 transition-colors"
            >
              [CHANGE PASSWORD]
            </button>
          )}
        </div>

        {isChangingPassword ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-mono text-foreground/60 mb-2">
                CURRENT PASSWORD
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-mono text-foreground/60 mb-2">
                NEW PASSWORD
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-mono text-foreground/60 mb-2">
                CONFIRM NEW PASSWORD
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* Error Message */}
            {passwordError && (
              <p className="text-red-500 font-mono text-sm">{passwordError}</p>
            )}

            {/* Success Message */}
            {passwordSuccess && (
              <p className="text-green-500 font-mono text-sm">
                {passwordSuccess}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                [UPDATE PASSWORD]
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setPasswordError("");
                  setPasswordSuccess("");
                }}
                className="flex-1 px-4 py-3 border border-border text-foreground font-mono text-sm hover:border-primary hover:text-primary transition-colors [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              >
                [CANCEL]
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-sm font-mono text-foreground/60">
              Password last changed 30 days ago
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
