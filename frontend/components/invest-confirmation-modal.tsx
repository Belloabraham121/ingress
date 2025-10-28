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

interface InvestConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ success: boolean; txHash?: string }>;
  strategy: string;
  amount: string;
  symbol: string;
  apy: number;
  projectedReturn: string;
  lockPeriod: string;
  riskLevel: string;
}

export function InvestConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  strategy,
  amount,
  symbol,
  apy,
  projectedReturn,
  lockPeriod,
  riskLevel,
}: InvestConfirmationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      // Call the actual deposit function from parent
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

  return (
    <>
      <Dialog open={isOpen && !showSuccess} onOpenChange={onClose}>
        <DialogContent className="border border-border bg-background max-w-md [clip-path:polygon(0_0,calc(100%_-_16px)_0,100%_0,100%_calc(100%_-_16px),calc(100%_-_16px)_100%,0_100%,0_16px)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-sentient">
              [CONFIRM INVESTMENT]
            </DialogTitle>
            <DialogDescription className="text-foreground/60 font-mono text-sm">
              Review the investment details before proceeding
            </DialogDescription>
          </DialogHeader>

          {/* Investment Details */}
          <div className="space-y-4 py-6 border-y border-border">
            {/* Strategy */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-mono text-foreground/60">
                STRATEGY
              </span>
              <span className="text-sm font-mono text-foreground">
                {strategy}
              </span>
            </div>

            {/* Investment Amount */}
            <div className="flex justify-between items-center py-3 border-y border-border/50">
              <span className="text-sm font-mono text-foreground/60">
                DEPOSIT AMOUNT
              </span>
              <div className="text-right">
                <p className="text-lg font-sentient text-primary">
                  {amount} {symbol}
                </p>
              </div>
            </div>

            {/* APY */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-mono text-foreground/60">APY</span>
              <span className="text-sm font-mono text-primary font-bold">
                {apy}%
              </span>
            </div>

            {/* Total After 1 Year */}
            <div className="flex justify-between items-center py-3 border-y border-border/50">
              <span className="text-sm font-mono text-foreground/60">
                TOTAL AFTER 1 YEAR
              </span>
              <div className="text-right">
                <p className="text-lg font-sentient text-primary">
                  {projectedReturn} {symbol}
                </p>
              </div>
            </div>

            {/* Lock Period & Risk */}
            <div className="space-y-2 pt-3 border-t border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-mono text-foreground/60">
                  LOCK PERIOD
                </span>
                <span className="text-sm font-mono text-foreground">
                  {lockPeriod}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-mono text-foreground/60">
                  RISK LEVEL
                </span>
                <span className="text-sm font-mono text-foreground">
                  {riskLevel}
                </span>
              </div>
            </div>
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
              {isProcessing ? "[PROCESSING...]" : "[CONFIRM INVESTMENT]"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="[DEPOSIT SUCCESSFUL]"
        message="Your vault deposit has been confirmed on Hedera testnet"
        details={[
          { label: "VAULT", value: strategy },
          { label: "DEPOSITED", value: `${amount} ${symbol}` },
          { label: "APY", value: `${apy}%` },
          {
            label: "VALUE AFTER 1 YEAR",
            value: `${projectedReturn} ${symbol}`,
          },
        ]}
        transactionHash={transactionHash}
        explorerUrl={`https://hashscan.io/testnet/transaction/${transactionHash}`}
        actionButtonText="[CONTINUE]"
      />
    </>
  );
}
