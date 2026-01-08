"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

interface InvestmentPosition {
  id: string
  strategy: string
  amount: string
  apy: number
  projectedAnnualReturn: string
  currentValue: string
  riskLevel: "Low" | "Medium" | "High"
}

const investmentPositions: InvestmentPosition[] = [
  {
    id: "1",
    strategy: "Conservative Fund",
    amount: "$2,000",
    apy: 8.5,
    projectedAnnualReturn: "$170",
    currentValue: "$2,000",
    riskLevel: "Low",
  },
  {
    id: "2",
    strategy: "Balanced Fund",
    amount: "$4,200",
    apy: 12.3,
    projectedAnnualReturn: "$516.60",
    currentValue: "$4,200",
    riskLevel: "Medium",
  },
  {
    id: "3",
    strategy: "Growth Fund",
    amount: "$6,250",
    apy: 18.7,
    projectedAnnualReturn: "$1,168.75",
    currentValue: "$6,250",
    riskLevel: "High",
  },
]

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "Low":
      return "text-green-500"
    case "Medium":
      return "text-yellow-500"
    case "High":
      return "text-red-500"
    default:
      return "text-foreground"
  }
}

export function InvestmentOverview() {
  const totalInvested = investmentPositions.reduce((sum, pos) => {
    const value = Number.parseFloat(pos.amount.replace("$", "").replace(",", ""))
    return sum + value
  }, 0)

  const totalProjectedReturn = investmentPositions.reduce((sum, pos) => {
    const value = Number.parseFloat(pos.projectedAnnualReturn.replace("$", "").replace(",", ""))
    return sum + value
  }, 0)

  return (
    <div className="border border-border bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-sentient mb-2">INVESTMENT PORTFOLIO</h3>
          <p className="text-xs font-mono text-foreground/60">Track your investment strategies</p>
        </div>
        <Link href="/portfolio">
          <Button variant="outline" className="text-xs bg-transparent">
            [VIEW ALL]
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-border/50 p-4">
          <p className="text-xs font-mono text-foreground/60 mb-2">TOTAL INVESTED</p>
          <p className="text-2xl font-sentient text-primary">${totalInvested.toFixed(2)}</p>
        </div>
        <div className="border border-border/50 p-4">
          <p className="text-xs font-mono text-foreground/60 mb-2">PROJECTED ANNUAL RETURN</p>
          <p className="text-2xl font-sentient text-primary">${totalProjectedReturn.toFixed(2)}</p>
        </div>
      </div>

      {/* Investment Positions Table */}
      <div className="border border-border/50 overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-3 text-foreground/60 font-medium">STRATEGY</th>
              <th className="text-right p-3 text-foreground/60 font-medium">AMOUNT</th>
              <th className="text-right p-3 text-foreground/60 font-medium">APY</th>
              <th className="text-right p-3 text-foreground/60 font-medium">ANNUAL RETURN</th>
              <th className="text-right p-3 text-foreground/60 font-medium">RISK</th>
            </tr>
          </thead>
          <tbody>
            {investmentPositions.map((position) => (
              <tr key={position.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                <td className="p-3 text-foreground">{position.strategy}</td>
                <td className="text-right p-3 text-foreground">{position.amount}</td>
                <td className="text-right p-3 text-primary font-bold">{position.apy}%</td>
                <td className="text-right p-3 text-foreground">{position.projectedAnnualReturn}</td>
                <td className={`text-right p-3 font-bold ${getRiskColor(position.riskLevel)}`}>{position.riskLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Button */}
      <Button className="w-full">[START NEW INVESTMENT]</Button>
    </div>
  )
}
