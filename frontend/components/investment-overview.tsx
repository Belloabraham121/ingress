"use client"

import { Button } from "@/components/ui/button"

interface VaultPosition {
  id: string
  vaultName: string
  symbol: string
  depositAmount: string
  apy: number
  realTimeApy: number
  projectedAnnualReturn: string
  currentValue: string
  depositDate: string
}

const vaultPositions: VaultPosition[] = [
  {
    id: "1",
    vaultName: "USDT Vault",
    symbol: "USDT",
    depositAmount: "$2,000",
    apy: 12.5,
    realTimeApy: 12.8,
    projectedAnnualReturn: "$250",
    currentValue: "$2,050",
    depositDate: "Jan 15, 2024",
  },
  {
    id: "2",
    vaultName: "USDC Vault",
    symbol: "USDC",
    depositAmount: "$3,500",
    apy: 11.8,
    realTimeApy: 11.9,
    projectedAnnualReturn: "$413",
    currentValue: "$3,620",
    depositDate: "Feb 20, 2024",
  },
  {
    id: "3",
    vaultName: "ETH Vault",
    symbol: "ETH",
    depositAmount: "$2,750",
    apy: 8.2,
    realTimeApy: 8.3,
    projectedAnnualReturn: "$225.50",
    currentValue: "$2,890",
    depositDate: "Mar 10, 2024",
  },
]

export function InvestmentOverview() {
  const totalDeposited = vaultPositions.reduce((sum, pos) => {
    const value = Number.parseFloat(pos.depositAmount.replace("$", "").replace(",", ""))
    return sum + value
  }, 0)

  const totalProjectedReturn = vaultPositions.reduce((sum, pos) => {
    const value = Number.parseFloat(pos.projectedAnnualReturn.replace("$", "").replace(",", ""))
    return sum + value
  }, 0)

  return (
    <div className="border border-border bg-background p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-sentient mb-2">TOKEN VAULT POSITIONS</h3>
        <p className="text-xs font-mono text-foreground/60">Track your active vault deposits and real-time APY</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-border/50 p-4">
          <p className="text-xs font-mono text-foreground/60 mb-2">TOTAL DEPOSITED</p>
          <p className="text-2xl font-sentient text-primary">${totalDeposited.toFixed(2)}</p>
        </div>
        <div className="border border-border/50 p-4">
          <p className="text-xs font-mono text-foreground/60 mb-2">PROJECTED ANNUAL RETURN</p>
          <p className="text-2xl font-sentient text-primary">${totalProjectedReturn.toFixed(2)}</p>
        </div>
      </div>

      {/* Vault Positions Table */}
      <div className="border border-border/50 overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-3 text-foreground/60 font-medium">VAULT</th>
              <th className="text-right p-3 text-foreground/60 font-medium">DEPOSITED</th>
              <th className="text-right p-3 text-foreground/60 font-medium">APY</th>
              <th className="text-right p-3 text-foreground/60 font-medium">REAL-TIME APY</th>
              <th className="text-right p-3 text-foreground/60 font-medium">ANNUAL RETURN</th>
            </tr>
          </thead>
          <tbody>
            {vaultPositions.map((position) => (
              <tr key={position.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                <td className="p-3 text-foreground">
                  <div>
                    <p className="font-medium">{position.vaultName}</p>
                    <p className="text-xs text-foreground/50">{position.symbol}</p>
                  </div>
                </td>
                <td className="text-right p-3 text-foreground">{position.depositAmount}</td>
                <td className="text-right p-3 text-primary font-bold">{position.apy}%</td>
                <td className="text-right p-3 text-green-500 font-bold">{position.realTimeApy}%</td>
                <td className="text-right p-3 text-foreground">{position.projectedAnnualReturn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Button */}
      <Button className="w-full">[DEPOSIT TO VAULT]</Button>
    </div>
  )
}
