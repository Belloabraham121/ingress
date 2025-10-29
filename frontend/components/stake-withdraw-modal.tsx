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

interface StakeWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ success: boolean; txHash?: string }>;
  poolName: string;
  token: string;
  amount: string;
  currentStake: string;
  pendingRewards?: string;
}

export function StakeWithdrawModal({
  isOpen,
  onClose,
  onConfirm,
  poolName,
  token,
  amount,
  currentStake,
  pendingRewards,
}: StakeWithdrawModalProps) {
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

  const remainingStake = (
    parseFloat(currentStake) - parseFloat(amount)
  ).toFixed(6);

  return (
    <>
      <Dialog open={isOpen && !showSuccess} onOpenChange={onClose}>
        <DialogContent className="border border-border bg-background max-w-md [clip-path:polygon(0_0,calc(100%_-_16px)_0,100%_0,100%_calc(100%_-_16px),calc(100%_-_16px)_100%,0_100%,0_16px)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-sentient">
              [CONFIRM UNSTAKE]
            </DialogTitle>
            <DialogDescription className="text-foreground/60 font-mono text-sm">
              Review the unstaking details before proceeding
            </DialogDescription>
          </DialogHeader>

          {/* Withdrawal Details */}
          <div className="space-y-4 py-6 border-y border-border">
            {/* Pool */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-mono text-foreground/60">
                FROM POOL
              </span>
              <span className="text-sm font-mono text-foreground">
                {poolName}
              </span>
            </div>

            {/* Unstake Amount */}
            <div className="flex justify-between items-center py-3 border-y border-border/50">
              <span className="text-sm font-mono text-foreground/60">
                UNSTAKE AMOUNT
              </span>
              <div className="text-right">
                <p className="text-lg font-sentient text-primary">
                  {amount} {token}
                </p>
              </div>
            </div>

            {/* Current Stake */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-mono text-foreground/60">
                CURRENT STAKE
              </span>
              <span className="text-sm font-mono text-foreground">
                {currentStake} {token}
              </span>
            </div>

            {/* Remaining Stake */}
            <div className="flex justify-between items-center pt-3 border-t border-border/50">
              <span className="text-sm font-mono text-foreground/60">
                REMAINING STAKE
              </span>
              <span className="text-sm font-mono text-primary">
                {remainingStake} {token}
              </span>
            </div>

            {/* Pending Rewards */}
            {pendingRewards && parseFloat(pendingRewards) > 0 && (
              <div className="flex justify-between items-center pt-3 border-t border-border/50">
                <span className="text-sm font-mono text-foreground/60">
                  PENDING REWARDS
                </span>
                <span className="text-sm font-mono text-green-500">
                  +{pendingRewards} {token}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 p-4">
            <p className="text-xs font-mono text-blue-400">
              ℹ️ Unstaking will automatically claim all pending rewards and
              transfer your staked tokens back to your wallet.
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
              {isProcessing ? "[PROCESSING...]" : "[CONFIRM UNSTAKE]"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="[UNSTAKE CONFIRMED]"
        message="Your tokens have been successfully unstaked"
        details={[
          { label: "POOL", value: poolName },
          { label: "UNSTAKED", value: `${amount} ${token}` },
          { label: "REMAINING STAKE", value: `${remainingStake} ${token}` },
          ...(pendingRewards && parseFloat(pendingRewards) > 0
            ? [
                {
                  label: "REWARDS CLAIMED",
                  value: `+${pendingRewards} ${token}`,
                },
              ]
            : []),
        ]}
        transactionHash={transactionHash}
        explorerUrl={`https://hashscan.io/testnet/transaction/${transactionHash}`}
        actionButtonText="[CONTINUE]"
      />
    </>
  );
}
