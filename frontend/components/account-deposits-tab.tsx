"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useBankAccount } from "@/hooks/useBankAccount";
import { AccountCreation } from "@/components/account-creation";
import { TransactionHistory } from "@/components/transaction-history";

export function AccountDepositsTab() {
  const {
    getBankAccountDetails,
    getAccountBalance,
    initializePayment,
    verifyPayment,
    refreshBalanceFromPaystack,
    isLoading,
  } = useBankAccount();
  const [bankAccount, setBankAccount] = useState<any>(null);
  const [hasAccount, setHasAccount] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundError, setFundError] = useState("");
  const [fundSuccess, setFundSuccess] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");

  useEffect(() => {
    loadBankAccount();
  }, []);

  const loadBankAccount = async () => {
    try {
      const account = await getBankAccountDetails();
      setBankAccount(account);
      setHasAccount(true);
    } catch (err) {
      // No bank account yet
      setHasAccount(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleFundWithCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setFundError("");
    setFundSuccess("");

    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      setFundError("Please enter a valid amount");
      return;
    }

    try {
      // Initialize payment
      const paymentData = await initializePayment({
        amount: fundAmount,
      });

      // Open Paystack payment page in new window/tab
      window.open(paymentData.authorizationUrl, "_blank");

      // Save reference for verification
      localStorage.setItem("paymentReference", paymentData.reference);

      setFundSuccess(
        "Payment window opened! Complete payment and click 'Verify Payment' when done."
      );
    } catch (err: any) {
      setFundError(err.message || "Failed to initialize payment");
    }
  };

  const handleVerifyPayment = async () => {
    const reference = localStorage.getItem("paymentReference");

    if (!reference) {
      setFundError("No pending payment found");
      return;
    }

    try {
      setFundError("");
      setFundSuccess("");

      const verificationData = await verifyPayment(reference);

      setFundSuccess(
        `Payment successful! ₦${verificationData.amount.toLocaleString()} added to your account.`
      );

      // Clear reference
      localStorage.removeItem("paymentReference");

      // Refresh bank account
      await loadBankAccount();

      // Reset form
      setFundAmount("");
      setShowFundModal(false);
    } catch (err: any) {
      setFundError(err.message || "Payment verification failed");
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    setRefreshMessage("");

    try {
      const result = await refreshBalanceFromPaystack();

      if (result.difference > 0) {
        setRefreshMessage(
          `✅ Balance updated! Added ₦${result.difference.toLocaleString()} (${
            result.transactionsSaved
          } new transactions saved)`
        );
      } else if (result.difference < 0) {
        setRefreshMessage(
          `✅ Balance updated! Adjusted by ₦${result.difference.toLocaleString()}`
        );
      } else {
        setRefreshMessage(
          `✅ Balance is up to date! (${
            result.transactionsFound
          } transactions checked${
            result.transactionsSaved > 0
              ? `, ${result.transactionsSaved} saved`
              : ""
          })`
        );
      }

      // Refresh the display
      await loadBankAccount();

      // Clear message after 5 seconds
      setTimeout(() => setRefreshMessage(""), 5000);
    } catch (err: any) {
      setRefreshMessage(
        `❌ ${err.message || "Failed to refresh balance. Please try again."}`
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="border border-border bg-background p-6">
        <p className="text-sm font-mono text-foreground/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Existing Bank Account or Create New */}
      {hasAccount && bankAccount ? (
        <div className="border border-border bg-background p-6">
          <h3 className="text-lg font-sentient mb-6">YOUR BANK ACCOUNT</h3>

          <div className="border border-border/50 p-4 space-y-3 mb-4">
            <div>
              <p className="text-xs font-mono text-foreground/60 mb-1">
                ACCOUNT NUMBER
              </p>
              <div className="flex items-center gap-3">
                <p className="text-lg font-sentient text-primary">
                  {bankAccount.accountNumber}
                </p>
                <button
                  onClick={() => copyToClipboard(bankAccount.accountNumber)}
                  className="px-3 py-2 border border-border text-xs font-mono text-foreground/60 hover:border-primary hover:text-primary transition-colors [clip-path:polygon(2px_0,calc(100%_-_2px)_0,100%_2px,100%_calc(100%_-_2px),calc(100%_-_2px)_100%,2px_100%,0_calc(100%_-_2px),0_2px)]"
                >
                  [COPY]
                </button>
              </div>
            </div>

            <div className="border-t border-border/50 pt-3">
              <p className="text-xs font-mono text-foreground/60 mb-1">
                BANK NAME
              </p>
              <p className="text-sm font-mono text-foreground">
                {bankAccount.bankName}
              </p>
            </div>

            <div className="border-t border-border/50 pt-3">
              <p className="text-xs font-mono text-foreground/60 mb-1">
                ACCOUNT NAME
              </p>
              <p className="text-sm font-mono text-foreground">
                {bankAccount.accountName}
              </p>
            </div>

            <div className="border-t border-border/50 pt-3">
              <p className="text-xs font-mono text-foreground/60 mb-1">
                CURRENCY
              </p>
              <p className="text-sm font-mono text-foreground">
                {bankAccount.currency}
              </p>
            </div>

            <div className="border-t border-border/50 pt-3">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-mono text-foreground/60">BALANCE</p>
                <button
                  onClick={handleRefreshBalance}
                  disabled={isRefreshing}
                  className="text-xs font-mono text-primary hover:opacity-70 transition-opacity disabled:opacity-50"
                >
                  {isRefreshing ? "[REFRESHING...]" : "[REFRESH]"}
                </button>
              </div>
              <p className="text-2xl font-sentient text-primary">
                ₦{(bankAccount.balance || 0).toLocaleString()}
              </p>
              {refreshMessage && (
                <p
                  className={`text-xs font-mono mt-2 ${
                    refreshMessage.startsWith("✅")
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {refreshMessage}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-mono text-green-500">
              ✓ Account active. Use this account number to fund your wallet.
            </p>

          </div>

          {/* Fund with Card Button */}
          <div className="border-t border-border/50 pt-4">
            <Button
              onClick={() => setShowFundModal(!showFundModal)}
              className="w-full"
            >
              {showFundModal ? "[HIDE CARD FUNDING]" : "[FUND WITH CARD]"}
            </Button>

            {/* Card Funding Form */}
            {showFundModal && (
              <form onSubmit={handleFundWithCard} className="mt-4 space-y-4">
                <div className="p-4 border border-border/50 bg-foreground/5 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]">
                  <p className="text-xs font-mono text-foreground/80 mb-2">
                    💳 PAY WITH DEBIT/CREDIT CARD
                  </p>
                  <p className="text-xs font-mono text-foreground/60">
                    Use your Naira debit card, credit card, or USSD to fund your
                    account instantly.
                  </p>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-xs font-mono text-foreground/60 mb-2">
                    AMOUNT (₦)
                  </label>
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="5000"
                    min="100"
                    step="100"
                    required
                    className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
                  />
                  <p className="text-xs font-mono text-foreground/50 mt-1">
                    Minimum: ₦100
                  </p>
                </div>

                {/* Error Message */}
                {fundError && (
                  <p className="text-red-500 font-mono text-sm">{fundError}</p>
                )}

                {/* Success Message */}
                {fundSuccess && (
                  <div className="space-y-3">
                    <p className="text-green-500 font-mono text-sm">
                      {fundSuccess}
                    </p>
                    {localStorage.getItem("paymentReference") && (
                      <Button
                        type="button"
                        onClick={handleVerifyPayment}
                        className="w-full"
                      >
                        [VERIFY PAYMENT]
                      </Button>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                {!fundSuccess && (
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "[PROCESSING...]" : "[PROCEED TO PAYMENT]"}
                  </Button>
                )}
              </form>
            )}
          </div>
        </div>
      ) : (
        <AccountCreation />
      )}

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  );
}
