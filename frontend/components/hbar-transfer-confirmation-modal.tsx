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
import { AlertTriangle } from "lucide-react";

interface HbarTransferConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{
    txId?: string;
    from?: string;
    to?: string;
    amount?: string;
  }>;
  recipientAccountId: string;
  amount: string;
  senderAccountId?: string;
  currentBalance?: string;
}

export function HbarTransferConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  recipientAccountId,
  amount,
  senderAccountId,
  currentBalance,
}: HbarTransferConfirmationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<{
    txId: string;
    from: string;
    to: string;
    amount: string;
  } | null>(null);
  const [error, setError] = useState<string>("");

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError("");

    try {
      // Call the actual transfer function
      const result = await onConfirm();

      if (result.txId) {
        // Success - store transaction details and show success modal
        setTransactionDetails({
          txId: result.txId,
          from: result.from || senderAccountId || "",
          to: result.to || recipientAccountId,
          amount: result.amount || amount,
        });
        setShowSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to transfer MNT. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setTransactionDetails(null);
    onClose();
  };

  // Calculate remaining balance
  const remainingBalance = currentBalance
    ? (parseFloat(currentBalance) - parseFloat(amount)).toFixed(2)
    : "0.00";

  // Hedera HashScan explorer URL
  const explorerUrl = transactionDetails
    ? `https://hashscan.io/testnet/transaction/${transactionDetails.txId}`
    : undefined;

  return (
    <>
      <Dialog open={isOpen && !showSuccess} onOpenChange={onClose}>
        <DialogContent className="border border-border bg-background max-w-md [clip-path:polygon(0_0,calc(100%_-_16px)_0,100%_0,100%_calc(100%_-_16px),calc(100%_-_16px)_100%,0_100%,0_16px)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-sentient">
              [CONFIRM TRANSFER]
            </DialogTitle>
            <DialogDescription className="text-foreground/60 font-mono text-sm">
              Review the transaction details before proceeding
            </DialogDescription>
          </DialogHeader>

          {/* Transfer Details */}
          <div className="space-y-4 py-6 border-y border-border">
            {/* From Account */}
            {senderAccountId && (
              <div className="space-y-1">
                <span className="text-sm font-mono text-foreground/60">
                  FROM ACCOUNT
                </span>
                <div className="p-3 bg-border/20 rounded border border-border/50">
                  <code className="text-xs font-mono text-foreground/80 break-all">
                    {senderAccountId}
                  </code>
                </div>
              </div>
            )}

            {/* To Account */}
            <div className="space-y-1">
              <span className="text-sm font-mono text-foreground/60">
                TO ACCOUNT
              </span>
              <div className="p-3 bg-border/20 rounded border border-border/50">
                <code className="text-xs font-mono text-foreground/80 break-all">
                  {recipientAccountId}
                </code>
              </div>
            </div>

            {/* Amount */}
            <div className="flex justify-between items-center py-4 border-y border-border/50">
              <span className="text-sm font-mono text-foreground/60">
                TRANSFER AMOUNT
              </span>
              <div className="text-right">
                <p className="text-2xl font-sentient text-primary">
                  {amount} MNT
                </p>
              </div>
            </div>

            {/* Balance Information */}
            {currentBalance && (
              <div className="space-y-2 pt-3 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono text-foreground/60">
                    CURRENT BALANCE
                  </span>
                  <span className="text-sm font-mono text-foreground">
                    {currentBalance} MNT
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono text-foreground/60">
                    REMAINING BALANCE
                  </span>
                  <span className="text-sm font-mono text-foreground font-bold">
                    {remainingBalance} MNT
                  </span>
                </div>
              </div>
            )}

            {/* Warning if balance is low */}
            {currentBalance && parseFloat(remainingBalance) < 1 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-mono text-yellow-500/90">
                  Warning: Your remaining balance will be low. Ensure you have
                  enough for future transactions.
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
              <p className="text-sm font-mono text-red-500">{error}</p>
            </div>
          )}

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
              {isProcessing ? "[PROCESSING...]" : "[APPROVE & SEND]"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      {transactionDetails && (
        <SuccessModal
          isOpen={showSuccess}
          onClose={handleSuccessClose}
          title="[TRANSFER SUCCESSFUL]"
          message="Your MNT transfer has been completed successfully"
          details={[
            { label: "FROM", value: transactionDetails.from },
            { label: "TO", value: transactionDetails.to },
            { label: "AMOUNT", value: `${transactionDetails.amount} MNT` },
            {
              label: "NEW BALANCE",
              value: currentBalance ? `${remainingBalance} MNT` : "—",
            },
          ]}
          transactionHash={transactionDetails.txId}
          explorerUrl={explorerUrl}
          actionButtonText="[DONE]"
        />
      )}
    </>
  );
}

