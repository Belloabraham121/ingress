"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TokenVaultCard } from "@/components/token-vault-card";
import { InvestConfirmationModal } from "@/components/invest-confirmation-modal";
import { VaultWithdrawModal } from "@/components/vault-withdraw-modal";
import { useVaults } from "@/hooks/useVaults";
import { useVaultDeposit } from "@/hooks/useVaultDeposit";
import { useVaultWithdraw } from "@/hooks/useVaultWithdraw";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface TokenVault {
  id: string;
  name: string;
  symbol: string;
  apy: number;
  tvl: string;
  minDeposit: number;
  status: "active" | "paused";
  realTimeApy?: number;
  vaultAddress?: string;
  tokenAddress?: string; // Asset (token) address
  depositorCount?: number;
  daysRemaining?: number;
}

export function TokenVaultSelector() {
  const { vaults, isLoading, error, refresh } = useVaults();
  const { deposit, isDepositing, error: depositError } = useVaultDeposit();
  const {
    withdraw,
    isWithdrawing,
    error: withdrawError,
    setError: setWithdrawError,
  } = useVaultWithdraw();
  const { toast } = useToast();
  const [selectedVault, setSelectedVault] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Store confirmation details to prevent recalculation when depositAmount clears
  const [confirmationDetails, setConfirmationDetails] = useState({
    amount: "",
    symbol: "",
    projectedReturn: "0.00",
    projectedEarnings: "0.00",
  });

  // Store withdrawal details
  const [withdrawalDetails, setWithdrawalDetails] = useState({
    amount: "",
    symbol: "",
    currentBalance: "0",
  });

  // Convert blockchain vaults to TokenVault format
  const tokenVaults: TokenVault[] = useMemo(() => {
    if (!vaults || vaults.length === 0) return [];

    return vaults
      .filter((v) => v.active) // Only show active vaults
      .map((vault) => ({
        id: vault.vaultAddress,
        name: vault.name,
        symbol: vault.symbol,
        apy: vault.apr,
        tvl: vault.tvl,
        minDeposit: 100, // Default min deposit (could be fetched from vault details)
        status: vault.active ? ("active" as const) : ("paused" as const),
        realTimeApy: vault.apr, // Real-time APY from blockchain
        vaultAddress: vault.vaultAddress,
        tokenAddress: vault.asset, // Asset (token) address for approvals
        depositorCount: vault.depositorCount,
        daysRemaining: vault.daysRemaining,
      }));
  }, [vaults]);

  // Auto-select first vault when loaded
  useEffect(() => {
    if (tokenVaults.length > 0 && !selectedVault) {
      setSelectedVault(tokenVaults[0].id);
    }
  }, [tokenVaults, selectedVault]);

  const selected = tokenVaults.find((vault) => vault.id === selectedVault);

  // Calculate projected return: deposit amount + APY earnings
  const projectedReturn = selected
    ? (
        Number.parseFloat(depositAmount || "0") *
        (1 + selected.apy / 100)
      ).toFixed(2)
    : "0.00";

  // Calculate just the earnings for display
  const projectedEarnings = selected
    ? (Number.parseFloat(depositAmount || "0") * (selected.apy / 100)).toFixed(
        2
      )
    : "0.00";

  const handleDepositClick = () => {
    if (
      depositAmount &&
      Number.parseFloat(depositAmount) >= (selected?.minDeposit || 0)
    ) {
      // Store the current values before opening modal
      setConfirmationDetails({
        amount: depositAmount,
        symbol: selected?.symbol || "",
        projectedReturn,
        projectedEarnings,
      });
      setShowConfirmation(true);
    }
  };

  const handleConfirmDeposit = async (): Promise<{
    success: boolean;
    txHash?: string;
  }> => {
    if (!selected || !confirmationDetails.amount) {
      return { success: false };
    }

    try {
      const result = await deposit({
        vaultAddress: selected.vaultAddress!,
        tokenAddress: selected.tokenAddress!,
        amount: confirmationDetails.amount,
        vaultName: selected.name,
        tokenSymbol: confirmationDetails.symbol,
      });

      if (result.success && result.txHash) {
        // Refresh vault data after successful deposit
        refresh();
        // Clear deposit amount and close confirmation
        setDepositAmount("");
        return { success: true, txHash: result.txHash };
      } else {
        toast({
          title: "Deposit Failed ❌",
          description: "Failed to deposit into vault",
          variant: "destructive",
        });
        return { success: false };
      }
    } catch (err: any) {
      console.error("Deposit error:", err);
      toast({
        title: "Deposit Failed ❌",
        description: err.message || "Failed to deposit into vault",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const handleWithdrawClick = () => {
    if (!selected || !withdrawAmount) return;

    // Clear any previous errors
    setWithdrawError(null);

    // Get current balance from vault
    const currentVault = vaults?.find(
      (v) => v.vaultAddress === selected.vaultAddress
    );
    // TODO: Fetch actual user deposit from contract
    const userDeposit = "0"; // Placeholder - should fetch from contract

    setWithdrawalDetails({
      amount: withdrawAmount,
      symbol: selected.symbol,
      currentBalance: userDeposit,
    });
    setShowWithdrawModal(true);
  };

  const handleConfirmWithdraw = async (): Promise<{
    success: boolean;
    txHash?: string;
  }> => {
    if (!selected || !withdrawalDetails.amount) {
      return { success: false };
    }

    try {
      const result = await withdraw({
        vaultAddress: selected.vaultAddress!,
        amount: withdrawalDetails.amount,
        vaultName: selected.name,
        tokenSymbol: withdrawalDetails.symbol,
      });

      if (result.success && result.txHash) {
        // Refresh vault data after successful withdrawal
        refresh();
        // Clear withdraw amount and any errors
        setWithdrawAmount("");
        setWithdrawError(null);
        return { success: true, txHash: result.txHash };
      } else {
        // Error will be set by the hook, but also show toast
        const errorMsg = withdrawError || "Failed to withdraw from vault";
        toast({
          title: "Withdrawal Failed ❌",
          description: errorMsg,
          variant: "destructive",
        });
        return { success: false };
      }
    } catch (err: any) {
      console.error("Withdrawal error:", err);
      // Error will be set by the hook, extract the message from API response if available
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        withdrawError ||
        "Failed to withdraw from vault";
      toast({
        title: "Withdrawal Failed ❌",
        description: errorMsg,
        variant: "destructive",
      });
      return { success: false };
    }
  };

  return (
    <>
      <div className="border border-border bg-background p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-sentient mb-2">TOKEN VAULT SYSTEM</h3>
            <p className="text-xs font-mono text-foreground/60">
              Deposit your tokens into secure vaults and earn real-time APY
              rewards
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="ml-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Deposit Error State */}
        {depositError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{depositError}</AlertDescription>
          </Alert>
        )}

        {/* Withdrawal Error State */}
        {withdrawError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{withdrawError}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && tokenVaults.length === 0 ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-mono text-foreground/60 mb-3">
                SELECT TOKEN VAULT
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border border-border p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : tokenVaults.length === 0 ? (
          /* Empty State */
          <div className="border border-border/50 p-8 text-center space-y-2">
            <p className="text-sm font-mono text-foreground/60">
              No active vaults found
            </p>
            <p className="text-xs font-mono text-foreground/40">
              Please deploy vaults first or check network connection
            </p>
          </div>
        ) : (
          /* Vault Selection */
          <div>
            <label className="block text-sm font-mono text-foreground/60 mb-3">
              SELECT TOKEN VAULT ({tokenVaults.length} available)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tokenVaults.map((vault) => (
                <TokenVaultCard
                  key={vault.id}
                  vault={vault}
                  isSelected={selectedVault === vault.id}
                  onSelect={setSelectedVault}
                />
              ))}
            </div>
          </div>
        )}

        {/* Deposit Amount */}
        {selected && (
          <>
            <div>
              <label className="block text-sm font-mono text-foreground/60 mb-3">
                DEPOSIT AMOUNT ({selected?.symbol})
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-foreground/30"
                min={selected.minDeposit}
              />
              <p className="text-xs font-mono text-foreground/40 mt-1">
                Minimum deposit: {selected.minDeposit} {selected.symbol}
              </p>
            </div>

            {/* Deposit Summary */}
            <div className="border border-border/50 p-4 space-y-2">
              <div className="flex justify-between text-sm font-mono">
                <span className="text-foreground/60">Vault TVL:</span>
                <span className="text-foreground">{selected.tvl}</span>
              </div>
              <div className="flex justify-between text-sm font-mono">
                <span className="text-foreground/60">Real-time APY:</span>
                <span className="text-primary font-bold">
                  {selected.realTimeApy?.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm font-mono">
                <span className="text-foreground/60">Annual Earnings:</span>
                <span className="text-primary">
                  +{projectedEarnings} {selected.symbol}
                </span>
              </div>
              <div className="flex justify-between text-sm font-mono">
                <span className="text-foreground/60">Total After 1 Year:</span>
                <span className="text-primary font-bold">
                  {projectedReturn} {selected.symbol}
                </span>
              </div>
              {selected.depositorCount !== undefined && (
                <div className="flex justify-between text-sm font-mono">
                  <span className="text-foreground/60">Total Depositors:</span>
                  <span className="text-foreground">
                    {selected.depositorCount}
                  </span>
                </div>
              )}
              {selected.daysRemaining !== undefined && (
                <div className="flex justify-between text-sm font-mono">
                  <span className="text-foreground/60">Rewards Remaining:</span>
                  <span className="text-foreground">
                    {selected.daysRemaining > 365
                      ? "1+ year"
                      : `~${selected.daysRemaining} days`}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-mono">
                <span className="text-foreground/60">Lock Period:</span>
                <span className="text-foreground">Flexible</span>
              </div>
            </div>

            <Button
              onClick={handleDepositClick}
              disabled={
                !depositAmount ||
                Number.parseFloat(depositAmount) <
                  (selected?.minDeposit || 0) ||
                isLoading ||
                isDepositing
              }
              className="w-full"
            >
              {isDepositing
                ? "PROCESSING..."
                : isLoading
                ? "LOADING..."
                : "[DEPOSIT TO VAULT]"}
            </Button>

            {/* Withdrawal Section */}
            <div className="pt-6 border-t border-border/30 space-y-4">
              <label className="block text-sm font-mono text-foreground/60">
                WITHDRAW FROM VAULT
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-foreground/30"
                min={0}
              />
              <p className="text-xs font-mono text-foreground/40">
                Your balance: 0 {selected.symbol}{" "}
                {/* TODO: Fetch from contract */}
              </p>
              <button
                onClick={handleWithdrawClick}
                disabled={
                  !withdrawAmount ||
                  Number.parseFloat(withdrawAmount) <= 0 ||
                  isLoading ||
                  isWithdrawing
                }
                className="w-full px-6 py-3 border border-border bg-background text-foreground font-mono text-sm font-medium transition-all duration-300 hover:border-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isWithdrawing
                  ? "PROCESSING..."
                  : isLoading
                  ? "LOADING..."
                  : "[WITHDRAW FROM VAULT]"}
              </button>
            </div>
          </>
        )}
      </div>

      {selected && (
        <>
          <InvestConfirmationModal
            isOpen={showConfirmation}
            onClose={() => {
              setShowConfirmation(false);
            }}
            onConfirm={handleConfirmDeposit}
            strategy={`${selected.name} (${selected.symbol})`}
            amount={confirmationDetails.amount}
            symbol={confirmationDetails.symbol}
            apy={selected.apy || 0}
            projectedReturn={confirmationDetails.projectedReturn}
            lockPeriod="Flexible"
            riskLevel="Low"
          />

          <VaultWithdrawModal
            isOpen={showWithdrawModal}
            onClose={() => {
              setShowWithdrawModal(false);
            }}
            onConfirm={handleConfirmWithdraw}
            vaultName={selected.name}
            symbol={withdrawalDetails.symbol}
            amount={withdrawalDetails.amount}
            currentBalance={withdrawalDetails.currentBalance}
          />
        </>
      )}
    </>
  );
}
