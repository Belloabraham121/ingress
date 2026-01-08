"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InvestConfirmationModal } from "@/components/invest-confirmation-modal"

interface InvestmentOption {
  id: string
  name: string
  apy: number
  minInvestment: number
  riskLevel: "Low" | "Medium" | "High"
}

const investmentOptions: InvestmentOption[] = [
  { id: "1", name: "Conservative Fund", apy: 8.5, minInvestment: 100, riskLevel: "Low" },
  { id: "2", name: "Balanced Fund", apy: 12.3, minInvestment: 500, riskLevel: "Medium" },
  { id: "3", name: "Growth Fund", apy: 18.7, minInvestment: 1000, riskLevel: "High" },
]

export function InvestCard() {
  const [selectedOption, setSelectedOption] = useState<string>("1")
  const [investAmount, setInvestAmount] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)

  const selected = investmentOptions.find((opt) => opt.id === selectedOption)
  const projectedReturn = selected ? (Number.parseFloat(investAmount || "0") * (selected.apy / 100)).toFixed(2) : "0.00"

  const handleInvestClick = () => {
    if (investAmount && Number.parseFloat(investAmount) >= (selected?.minInvestment || 0)) {
      setShowConfirmation(true)
    }
  }

  const handleConfirmInvest = () => {
    setShowConfirmation(false)
    setInvestAmount("")
    // Here you would typically make an API call to process the investment
  }

  return (
    <>
      <div className="border border-border bg-background p-6 space-y-6">
        <div>
          <label className="block text-sm font-mono text-foreground/60 mb-3">SELECT INVESTMENT STRATEGY</label>
          <div className="space-y-2">
            {investmentOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full p-4 border text-left transition-colors ${
                  selectedOption === option.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono font-medium text-foreground">{option.name}</p>
                    <p className="text-xs font-mono text-foreground/50 mt-1">
                      Min: ${option.minInvestment} • Risk: {option.riskLevel}
                    </p>
                  </div>
                  <p className="text-primary font-mono font-bold">{option.apy}% APY</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-mono text-foreground/60 mb-3">INVESTMENT AMOUNT (USDT)</label>
          <Input
            type="number"
            placeholder="0.00"
            value={investAmount}
            onChange={(e) => setInvestAmount(e.target.value)}
            className="bg-background border-border text-foreground placeholder:text-foreground/30"
          />
        </div>

        <div className="border border-border/50 p-4 space-y-2">
          <div className="flex justify-between text-sm font-mono">
            <span className="text-foreground/60">Projected Annual Return:</span>
            <span className="text-primary">${projectedReturn}</span>
          </div>
          <div className="flex justify-between text-sm font-mono">
            <span className="text-foreground/60">Lock Period:</span>
            <span className="text-foreground">30 days</span>
          </div>
        </div>

        <Button
          onClick={handleInvestClick}
          disabled={!investAmount || Number.parseFloat(investAmount) < (selected?.minInvestment || 0)}
          className="w-full"
        >
          [INVEST NOW]
        </Button>
      </div>

      <InvestConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmInvest}
        strategy={selected?.name || ""}
        amount={investAmount}
        apy={selected?.apy || 0}
        projectedReturn={projectedReturn}
        lockPeriod="30 days"
        riskLevel={selected?.riskLevel || ""}
      />
    </>
  )
}
