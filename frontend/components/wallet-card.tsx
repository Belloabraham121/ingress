"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBankAccount } from "@/hooks/useBankAccount";
import { Button } from "@/components/ui/button";
import { HbarTransferConfirmationModal } from "@/components/hbar-transfer-confirmation-modal";
import { TokenTransferModal } from "./token-transfer-modal";
import { getAllTokenBalances } from "@/lib/hedera-utils";

interface Asset {
  name: string;
  symbol: string;
  amount: number;
  value: number;
  address?: string;
}

export function WalletCard() {
  const { getProfile, sendHbar, transferHbar, getWalletBalance } = useAuth();
  const { getBalance } = useBankAccount();
  const [showDetails, setShowDetails] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [nairaBalance, setNairaBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSendHbar, setShowSendHbar] = useState(false);
  const [showTransferHbar, setShowTransferHbar] = useState(false);
  const [showTokenTransfer, setShowTokenTransfer] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Asset | null>(null);
  const [sendAmount, setSendAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientAccountId, setRecipientAccountId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [currentUserAccountId, setCurrentUserAccountId] = useState<string>("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);

  useEffect(() => {
    loadBalances();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadBalances, 30000);
    const onWalletUpdated = () => loadBalances();
    window.addEventListener("walletUpdated", onWalletUpdated);
    return () => {
      clearInterval(interval);
      window.removeEventListener("walletUpdated", onWalletUpdated);
    };
  }, []);

  const loadBalances = async () => {
    try {
      // Load wallet balance (live) and profile
      const [profile, liveBalance] = await Promise.all([
        getProfile(),
        getWalletBalance(),
      ]);
      setWalletBalance(liveBalance.balance || profile.wallet.balance || 0);
      const accountId = profile.wallet.accountId || "";
      setCurrentUserAccountId(accountId);

      // Load bank account balance
      try {
        const balance = await getBalance();
        setNairaBalance(balance.balance || 0);
      } catch (err) {
        // Bank account might not exist yet
        console.log("No bank account found, setting balance to 0");
        setNairaBalance(0);
      }

      // Load token balances
      if (accountId) {
        setAssetsLoading(true);
        try {
          const tokenBalances = await getAllTokenBalances(accountId);
          setAssets(tokenBalances);
        } catch (err) {
          console.error("Failed to load token balances:", err);
          // Set empty array if loading fails
          setAssets([]);
        } finally {
          setAssetsLoading(false);
        }
      }
    } catch (err) {
      console.error("Failed to load balances:", err);
      setWalletBalance(0);
      setNairaBalance(0);
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendHbar = async () => {
    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      setActionError("Please enter a valid amount");
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      await sendHbar(sendAmount);
      setActionSuccess(`Successfully sent ${sendAmount} HBAR to your wallet`);
      setSendAmount("");
      await loadBalances(); // Refresh balances
      setTimeout(() => {
        setShowSendHbar(false);
        setActionSuccess("");
      }, 2000);
    } catch (err: any) {
      setActionError(err.message || "Failed to send HBAR");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferHbar = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setActionError("Please enter a valid amount");
      return;
    }

    if (!recipientAccountId || !recipientAccountId.match(/^0\.0\.\d+$/)) {
      setActionError(
        "Please enter a valid Hedera Account ID (e.g., 0.0.12345)"
      );
      return;
    }

    // Show confirmation modal instead of directly transferring
    setActionError("");
    setShowConfirmationModal(true);
  };

  const executeTransfer = async () => {
    // This function is called when user confirms in the modal
    try {
      const result = await transferHbar(recipientAccountId, transferAmount);

      // Clear form and refresh balances
      setTransferAmount("");
      setRecipientAccountId("");
      await loadBalances();
      setShowTransferHbar(false);

      // Return transaction details for success modal
      return {
        txId: result.txId,
        from: result.from || currentUserAccountId,
        to: result.to || recipientAccountId,
        amount: result.amount || transferAmount,
      };
    } catch (err: any) {
      throw new Error(err.message || "Failed to transfer HBAR");
    }
  };

  // Calculate total balance from actual token balances
  const totalBalance = assets.reduce((sum, asset) => sum + asset.value, 0);

  return (
    <div className="space-y-4">
      {/* Main Wallet Card */}
      <div className="border border-border bg-background p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs font-mono text-foreground/60">WALLET BALANCE</p>
          {isLoading && (
            <span className="text-xs font-mono text-foreground/40">
              Loading...
            </span>
          )}
        </div>

        {/* Hedera Wallet Balance */}
        <div className="mb-6 pb-6 border-b border-border/50">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-mono text-foreground/50">
              HEDERA WALLET (HBAR)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowSendHbar(!showSendHbar);
                  setShowTransferHbar(false);
                  setActionError("");
                  setActionSuccess("");
                }}
                className="text-xs font-mono text-primary hover:opacity-70 transition-opacity"
              >
                [RECEIVE]
              </button>
              <button
                onClick={() => {
                  setShowTransferHbar(!showTransferHbar);
                  setShowSendHbar(false);
                  setActionError("");
                  setActionSuccess("");
                }}
                className="text-xs font-mono text-primary hover:opacity-70 transition-opacity"
              >
                [SEND]
              </button>
            </div>
          </div>
          <p className="text-2xl font-sentient text-primary mb-4">
            {walletBalance.toLocaleString()} HBAR
          </p>

          {/* Send HBAR Form */}
          {showSendHbar && (
            <div className="mt-4 p-4 border border-border/50 space-y-3">
              <p className="text-xs font-mono text-foreground/60">
                RECEIVE HBAR TO YOUR WALLET
              </p>
              <input
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="Amount (e.g., 10)"
                className="w-full px-3 py-2 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
              />
              {actionError && (
                <p className="text-xs font-mono text-red-500">{actionError}</p>
              )}
              {actionSuccess && (
                <p className="text-xs font-mono text-green-500">
                  {actionSuccess}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSendHbar}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-primary text-background font-mono text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {actionLoading ? "PROCESSING..." : "RECEIVE HBAR"}
                </button>
                <button
                  onClick={() => {
                    setShowSendHbar(false);
                    setSendAmount("");
                    setActionError("");
                    setActionSuccess("");
                  }}
                  className="px-4 py-2 border border-border text-foreground font-mono text-sm hover:border-primary hover:text-primary transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}

          {/* Transfer HBAR Form */}
          {showTransferHbar && (
            <div className="mt-4 p-4 border border-border/50 space-y-3">
              <p className="text-xs font-mono text-foreground/60">
                SEND HBAR TO ANOTHER ACCOUNT
              </p>
              <input
                type="text"
                value={recipientAccountId}
                onChange={(e) => setRecipientAccountId(e.target.value)}
                placeholder="Recipient Account ID (e.g., 0.0.67890)"
                className="w-full px-3 py-2 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="Amount (e.g., 5)"
                className="w-full px-3 py-2 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
              />
              {actionError && (
                <p className="text-xs font-mono text-red-500">{actionError}</p>
              )}
              {actionSuccess && (
                <p className="text-xs font-mono text-green-500">
                  {actionSuccess}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleTransferHbar}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-primary text-background font-mono text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {actionLoading ? "PROCESSING..." : "SEND HBAR"}
                </button>
                <button
                  onClick={() => {
                    setShowTransferHbar(false);
                    setTransferAmount("");
                    setRecipientAccountId("");
                    setActionError("");
                    setActionSuccess("");
                  }}
                  className="px-4 py-2 border border-border text-foreground font-mono text-sm hover:border-primary hover:text-primary transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Naira Balance */}
        <div className="mb-6 pb-6 border-b border-border/50">
          <p className="text-xs font-mono text-foreground/50 mb-2">
            NAIRA (NGN)
          </p>
          <p className="text-2xl font-sentient text-primary">
            ₦{nairaBalance.toLocaleString()}
          </p>
        </div>

        {/* Total Token Balance - Clickable */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-left transition-all duration-300 hover:opacity-80"
        >
          <p className="text-xs font-mono text-foreground/50 mb-2">
            TOTAL TOKENS (USD)
          </p>
          <div className="flex justify-between items-center">
            <p className="text-3xl font-sentient text-primary">
              ${totalBalance.toLocaleString()}
            </p>
            <span className="text-xs font-mono text-foreground/60">
              {showDetails ? "[HIDE]" : "[VIEW]"}
            </span>
          </div>
        </button>
      </div>

      {showDetails && (
        <div className="border border-border bg-background p-6 animate-in fade-in duration-300">
          <h3 className="text-lg font-sentient mb-6">ASSET BREAKDOWN</h3>

          {assetsLoading ? (
            <div className="text-center py-8">
              <p className="text-sm font-mono text-foreground/60">
                Loading token balances...
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-4 mb-4 pb-4 border-b border-border/50">
                <div className="text-xs font-mono text-foreground/60">
                  ASSET
                </div>
                <div className="text-xs font-mono text-foreground/60">
                  SYMBOL
                </div>
                <div className="text-xs font-mono text-foreground/60 text-right">
                  AMOUNT
                </div>
                <div className="text-xs font-mono text-foreground/60 text-right">
                  VALUE (USD)
                </div>
                <div className="text-xs font-mono text-foreground/60 text-right">
                  ACTION
                </div>
              </div>

              {/* Table Rows */}
              <div className="space-y-3">
                {assets.length > 0 ? (
                  assets.map((asset, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-5 gap-4 py-3 border-b border-border/30 last:border-0"
                    >
                      <div className="text-sm font-mono text-foreground">
                        {asset.name}
                      </div>
                      <div className="text-sm font-mono text-primary font-medium">
                        {asset.symbol}
                      </div>
                      <div className="text-sm font-mono text-foreground text-right">
                        {asset.amount.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-sm font-mono text-foreground text-right">
                        $
                        {asset.value.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-right">
                        <button
                          className="text-xs font-mono text-primary hover:opacity-80"
                          onClick={() => {
                            setSelectedToken(asset);
                            setShowTokenTransfer(true);
                          }}
                        >
                          [SEND]
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm font-mono text-foreground/60">
                      No token balances found
                    </p>
                  </div>
                )}
              </div>

              {/* Total Row */}
              {assets.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
                  <div className="text-sm font-mono font-medium text-foreground">
                    TOTAL
                  </div>
                  <div></div>
                  <div></div>
                  <div className="text-sm font-mono font-medium text-primary text-right">
                    ${totalBalance.toLocaleString()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* HBAR Transfer Confirmation Modal */}
      <HbarTransferConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={executeTransfer}
        recipientAccountId={recipientAccountId}
        amount={transferAmount}
        senderAccountId={currentUserAccountId}
        currentBalance={walletBalance.toString()}
      />

      {/* Token Transfer Modal */}
      <TokenTransferModal
        isOpen={showTokenTransfer}
        onClose={() => setShowTokenTransfer(false)}
        token={selectedToken}
      />
    </div>
  );
}
