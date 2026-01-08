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

interface StakeConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  token: string
  amount: string
  apy: number
  dailyRewards: string
  unstakeCooldown: string
}

export function StakeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  token,
  amount,
  apy,
  dailyRewards,
  unstakeCooldown,
}: StakeConfirmationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [transactionId] = useState(`STK-${Date.now()}`)

  const handleConfirm = async () => {
    setIsProcessing(true)
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
            <DialogTitle className="text-2xl font-sentient">[CONFIRM STAKE]</DialogTitle>
            <DialogDescription className="text-foreground/60 font-mono text-sm">
              Review the staking details before proceeding
            </DialogDescription>
          </DialogHeader>

          {/* Staking Details */}
          <div className="space-y-4 py-6 border-y border-border">
            {/* Stake Amount */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-mono text-foreground/60">STAKE AMOUNT</span>
              <div className="text-right">
                <p className="text-lg font-sentient text-primary">
                  {amount} {token}
                </p>
              </div>
            </div>

            {/* APY */}
            <div className="flex justify-between items-center py-3 border-y border-border/50">
              <span className="text-sm font-mono text-foreground/60">APY</span>
              <span className="text-sm font-mono text-primary font-bold">{apy}%</span>
            </div>

            {/* Daily Rewards */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-mono text-foreground/60">DAILY REWARDS</span>
              <div className="text-right">
                <p className="text-lg font-sentient text-primary">{dailyRewards}</p>
              </div>
            </div>

            {/* Unstake Cooldown */}
            <div className="flex justify-between items-center pt-3 border-t border-border/50">
              <span className="text-sm font-mono text-foreground/60">UNSTAKE COOLDOWN</span>
              <span className="text-sm font-mono text-foreground">{unstakeCooldown}</span>
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
              {isProcessing ? "[PROCESSING...]" : "[CONFIRM STAKE]"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="[STAKING CONFIRMED]"
        message="Your tokens have been successfully staked"
        details={[
          { label: "STAKE AMOUNT", value: `${amount} ${token}` },
          { label: "APY", value: `${apy}%` },
          { label: "DAILY REWARDS", value: dailyRewards },
          { label: "UNSTAKE COOLDOWN", value: unstakeCooldown },
          { label: "TRANSACTION ID", value: transactionId },
        ]}
        actionButtonText="[CONTINUE]"
      />
    </>
  )
}
