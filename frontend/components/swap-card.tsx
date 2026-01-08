"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowDownUp } from "lucide-react"
import { SwapConfirmationModal } from "@/components/swap-confirmation-modal"

export function SwapCard() {
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [fromCurrency, setFromCurrency] = useState("NGN")
  const [toCurrency, setToCurrency] = useState("USDT")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSwap = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleConvert = (value: string) => {
    setFromAmount(value)
    // Mock conversion rate: 1 NGN = 0.0006 USDT
    const converted = (Number.parseFloat(value) * 0.0006).toFixed(2)
    setToAmount(converted || "")
  }

  const exchangeRate =
    fromAmount && toAmount
      ? `1 ${fromCurrency} = ${(Number.parseFloat(toAmount) / Number.parseFloat(fromAmount)).toFixed(6)} ${toCurrency}`
      : "0"

  const handleConfirmSwap = () => {
    // Process the swap here
    console.log(`Swapped ${fromAmount} ${fromCurrency} to ${toAmount} ${toCurrency}`)
    setIsModalOpen(false)
    // Reset form
    setFromAmount("")
    setToAmount("")
  }

  return (
    <>
      <div className="border border-border bg-background p-6 space-y-6">
        <div>
          <label className="block text-sm font-mono text-foreground/60 mb-3">FROM</label>
          <div className="flex gap-3">
            <Input
              type="number"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => handleConvert(e.target.value)}
              className="flex-1 bg-background border-border text-foreground placeholder:text-foreground/30"
            />
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="px-4 py-2 bg-background border border-border text-foreground font-mono text-sm cursor-pointer hover:border-primary/50 transition-colors"
            >
              <option>NGN</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </div>
        </div>

        <div className="flex justify-center">
          <button onClick={handleSwap} className="p-2 border border-border hover:border-primary/50 transition-colors">
            <ArrowDownUp className="w-5 h-5 text-primary" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-mono text-foreground/60 mb-3">TO</label>
          <div className="flex gap-3">
            <Input
              type="number"
              placeholder="0.00"
              value={toAmount}
              readOnly
              className="flex-1 bg-background border-border text-foreground placeholder:text-foreground/30"
            />
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="px-4 py-2 bg-background border border-border text-foreground font-mono text-sm cursor-pointer hover:border-primary/50 transition-colors"
            >
              <option>USDT</option>
              <option>USDC</option>
              <option>ETH</option>
            </select>
          </div>
        </div>

        <Button onClick={() => setIsModalOpen(true)} disabled={!fromAmount || !toAmount} className="w-full">
          [SWAP]
        </Button>
      </div>

      <SwapConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSwap}
        fromAmount={fromAmount}
        fromCurrency={fromCurrency}
        toAmount={toAmount}
        toCurrency={toCurrency}
        exchangeRate={exchangeRate}
      />
    </>
  )
}
