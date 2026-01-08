"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

interface StakingPosition {
  id: string
  token: string
  amount: string
  apy: number
  dailyRewards: string
  totalValue: string
}

const stakingPositions: StakingPosition[] = [
  {
    id: "1",
    token: "USDT",
    amount: "5,000",
    apy: 6.5,
    dailyRewards: "0.8904",
    totalValue: "$5,000",
  },
  {
    id: "2",
    token: "USDC",
    amount: "3,500",
    apy: 7.2,
    dailyRewards: "0.6904",
    totalValue: "$3,500",
  },
  {
    id: "3",
    token: "ETH",
    amount: "1.25",
    apy: 4.8,
    dailyRewards: "0.0001667",
    totalValue: "$3,250.50",
  },
]

export function StakingOverview() {
  const totalStaked = stakingPositions.reduce((sum, pos) => {
    const value = Number.parseFloat(pos.totalValue.replace("$", "").replace(",", ""))
    return sum + value
  }, 0)

  const totalDailyRewards = stakingPositions.reduce((sum, pos) => {
    return sum + Number.parseFloat(pos.dailyRewards)
  }, 0)

  return (
    <div className="border border-border bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-sentient mb-2">STAKING OVERVIEW</h3>
          <p className="text-xs font-mono text-foreground/60">Monitor your staked assets across pools</p>
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
          <p className="text-xs font-mono text-foreground/60 mb-2">TOTAL STAKED</p>
          <p className="text-2xl font-sentient text-primary">${totalStaked.toFixed(2)}</p>
        </div>
        <div className="border border-border/50 p-4">
          <p className="text-xs font-mono text-foreground/60 mb-2">DAILY REWARDS</p>
          <p className="text-2xl font-sentient text-primary">${totalDailyRewards.toFixed(4)}</p>
        </div>
      </div>

      {/* Staking Positions Table */}
      <div className="border border-border/50 overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-3 text-foreground/60 font-medium">TOKEN</th>
              <th className="text-right p-3 text-foreground/60 font-medium">AMOUNT</th>
              <th className="text-right p-3 text-foreground/60 font-medium">APY</th>
              <th className="text-right p-3 text-foreground/60 font-medium">DAILY REWARDS</th>
              <th className="text-right p-3 text-foreground/60 font-medium">VALUE</th>
            </tr>
          </thead>
          <tbody>
            {stakingPositions.map((position) => (
              <tr key={position.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                <td className="p-3 text-foreground">{position.token}</td>
                <td className="text-right p-3 text-foreground">{position.amount}</td>
                <td className="text-right p-3 text-primary font-bold">{position.apy}%</td>
                <td className="text-right p-3 text-foreground">{position.dailyRewards}</td>
                <td className="text-right p-3 text-foreground">{position.totalValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Button */}
      <Button className="w-full">[ADD MORE STAKES]</Button>
    </div>
  )
}
