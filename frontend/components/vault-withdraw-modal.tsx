"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SuccessModal } from "@/components/success-modal";

interface VaultWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ success: boolean; txHash?: string }>;
  vaultName: string;
  symbol: string;
  amount: string;
  currentBalance: string;
}

export function VaultWithdrawModal({
  isOpen,
  onClose,
  onConfirm,
  vaultName,
  symbol,
  amount,
  currentBalance,
}: VaultWithdrawModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const result = await onConfirm();
      if (result.success && result.txHash) {
        setTransactionHash(result.txHash);
        setShowSuccess(true);
      }
    } catch (error) {
      console.error("Error in confirmation:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setTransactionHash("");
    onClose();
  };

  const remainingBalance = (
    parseFloat(currentBalance) - parseFloat(amount)
  ).toFixed(6);

  return (
    <>
      <Dialog open={isOpen && !showSuccess} onOpenChange={onClose}>
        <DialogContent className="border border-border bg-background max-w-md [clip-path:polygon(0_0,calc(100%_-_16px)_0,100%_0,100%_calc(100%_-_16px),calc(100%_-_16px)_100%,0_100%,0_16px)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-sentient">
              [CONFIRM WITHDRAWAL]
            </DialogTitle>
            <DialogDescription className="text-foreground/60 font-mono text-sm">
              Review the withdrawal details before proceeding
            </DialogDescription>
          </DialogHeader>

          {/* Withdrawal Details */}
          <div className="space-y-4 py-6 border-y border-border">
            {/* Vault */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-mono text-foreground/60">
                FROM VAULT
              </span>
              <span className="text-sm font-mono text-foreground">
                {vaultName}
              </span>
            </div>

            {/* Withdrawal Amount */}
            <div className="flex justify-between items-center py-3 border-y border-border/50">
              <span className="text-sm font-mono text-foreground/60">
                WITHDRAW AMOUNT
              </span>
              <div className="text-right">
                <p className="text-lg font-sentient text-primary">
                  {amount} {symbol}
                </p>
              </div>
            </div>

            {/* Current Balance */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-mono text-foreground/60">
                CURRENT BALANCE
              </span>
              <span className="text-sm font-mono text-foreground">
                {currentBalance} {symbol}
              </span>
            </div>

            {/* Remaining Balance */}
            <div className="flex justify-between items-center pt-3 border-t border-border/50">
              <span className="text-sm font-mono text-foreground/60">
                REMAINING BALANCE
              </span>
              <span className="text-sm font-mono text-primary">
                {remainingBalance} {symbol}
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 p-4">
            <p className="text-xs font-mono text-yellow-500">
              ⚠️ Withdrawing will claim all pending rewards and transfer your
              tokens back to your wallet.
            </p>
          </div>

          {/* Action Buttons */}
          <DialogFooter className="flex gap-3 pt-6">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 border border-border text-foreground font-mono text-sm font-medium transition-all duration-300 hover:border-primary/50 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed [clip-path:polygon(0_0,calc(100%_-_12px)_0,100%_0,100%_calc(100%_-_12px),calc(100%_-_12px)_100%,0_100%,0_12px)]"
            >
              [CANCEL]
            </button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? "[PROCESSING...]" : "[CONFIRM WITHDRAWAL]"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="[WITHDRAWAL CONFIRMED]"
        message="Your tokens have been successfully withdrawn from the vault"
        details={[
          { label: "VAULT", value: vaultName },
          { label: "WITHDRAWN", value: `${amount} ${symbol}` },
          { label: "REMAINING", value: `${remainingBalance} ${symbol}` },
        ]}
        transactionHash={transactionHash}
        explorerUrl={`https://hashscan.io/testnet/transaction/${transactionHash}`}
        actionButtonText="[CONTINUE]"
      />
    </>
  );
}
