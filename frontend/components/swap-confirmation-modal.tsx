"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SuccessModal } from "@/components/success-modal"

interface SwapConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  fromAmount: string
  fromCurrency: string
  toAmount: string
  toCurrency: string
  exchangeRate: string
}

export function SwapConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  fromAmount,
  fromCurrency,
  toAmount,
  toCurrency,
  exchangeRate,
}: SwapConfirmationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [transactionId] = useState(`TXN-${Date.now()}`)

  const handleConfirm = async () => {
    setIsProcessing(true)
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setShowSuccess(true)
    setIsProcessing(false)
  }

  const handleSuccessClose = () => {
    setShowSuccess(false)
    onConfirm()
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen && !showSuccess} onOpenChange={onClose}>
        <DialogContent className="border border-border bg-background max-w-md [clip-path:polygon(0_0,calc(100%_-_16px)_0,100%_0,100%_calc(100%_-_16px),calc(100%_-_16px)_100%,0_100%,0_16px)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-sentient">[CONFIRM SWAP]</DialogTitle>
            <DialogDescription className="text-foreground/60 font-mono text-sm">
              Review the transaction details before proceeding
            </DialogDescription>
          </DialogHeader>

          {/* Transaction Details */}
          <div className="space-y-4 py-6 border-y border-border">
            {/* From Amount */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-mono text-foreground/60">FROM</span>
              <div className="text-right">
                <p className="text-lg font-sentient text-primary">
                  {fromAmount} {fromCurrency}
                </p>
              </div>
            </div>

            {/* Exchange Rate */}
            <div className="flex justify-between items-center py-3 border-y border-border/50">
              <span className="text-sm font-mono text-foreground/60">EXCHANGE RATE</span>
              <span className="text-sm font-mono text-foreground">{exchangeRate}</span>
            </div>

            {/* To Amount */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-mono text-foreground/60">YOU WILL RECEIVE</span>
              <div className="text-right">
                <p className="text-lg font-sentient text-primary">
                  {toAmount} {toCurrency}
                </p>
              </div>
            </div>

            {/* Fee Info */}
            <div className="flex justify-between items-center pt-3 border-t border-border/50">
              <span className="text-sm font-mono text-foreground/60">TRANSACTION FEE</span>
              <span className="text-sm font-mono text-foreground/50">0.5%</span>
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
            <Button onClick={handleConfirm} disabled={isProcessing} className="flex-1">
              {isProcessing ? "[PROCESSING...]" : "[CONFIRM SWAP]"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="[SWAP SUCCESSFUL]"
        message="Your tokens have been swapped successfully"
        details={[
          { label: "FROM", value: `${fromAmount} ${fromCurrency}` },
          { label: "TO", value: `${toAmount} ${toCurrency}` },
          { label: "EXCHANGE RATE", value: exchangeRate },
          { label: "TRANSACTION ID", value: transactionId },
        ]}
        actionButtonText="[CONTINUE]"
      />
    </>
  )
}
