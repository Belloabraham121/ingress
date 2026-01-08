"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  details?: Array<{
    label: string
    value: string
  }>
  actionButtonText?: string
  autoCloseDelay?: number
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  details = [],
  actionButtonText = "[DONE]",
  autoCloseDelay = 0,
}: SuccessModalProps) {
  const [isVisible, setIsVisible] = useState(isOpen)

  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoCloseDelay])

  const handleClose = () => {
    setIsVisible(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="border border-border bg-background max-w-md [clip-path:polygon(0_0,calc(100%_-_16px)_0,100%_0,100%_calc(100%_-_16px),calc(100%_-_16px)_100%,0_100%,0_16px)]">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 border-2 border-primary flex items-center justify-center [clip-path:polygon(0_0,calc(100%_-_8px)_0,100%_0,100%_calc(100%_-_8px),calc(100%_-_8px)_100%,0_100%,0_8px)]">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <DialogHeader>
          <DialogTitle className="text-2xl font-sentient text-center">{title}</DialogTitle>
          <DialogDescription className="text-foreground/60 font-mono text-sm text-center">{message}</DialogDescription>
        </DialogHeader>

        {/* Transaction Details */}
        {details.length > 0 && (
          <div className="space-y-3 py-6 border-y border-border">
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm font-mono text-foreground/60">{detail.label}</span>
                <span className="text-sm font-mono text-foreground font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <DialogFooter className="pt-6">
          <Button onClick={handleClose} className="w-full">
            {actionButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
