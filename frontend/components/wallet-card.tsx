"use client"

import { useState } from "react"

interface Asset {
  name: string
  symbol: string
  amount: number
  value: number
}

const assets: Asset[] = [
  { name: "Tether", symbol: "USDT", amount: 5000, value: 5000 },
  { name: "USD Coin", symbol: "USDC", amount: 3200, value: 3200 },
  { name: "Ethereum", symbol: "ETH", amount: 2.5, value: 4250 },
  { name: "Bitcoin", symbol: "BTC", amount: 0.15, value: 6750 },
  { name: "Polygon", symbol: "MATIC", amount: 1500, value: 1250 },
]

export function WalletCard() {
  const [showDetails, setShowDetails] = useState(false)
  const totalBalance = 20450.5
  const nairaBalance = 8000000

  return (
    <div className="space-y-4">
      {/* Main Wallet Card */}
      <div className="border border-border bg-background p-6">
        <p className="text-xs font-mono text-foreground/60 mb-4">WALLET BALANCE</p>

        {/* Naira Balance */}
        <div className="mb-6 pb-6 border-b border-border/50">
          <p className="text-xs font-mono text-foreground/50 mb-2">NAIRA (NGN)</p>
          <p className="text-2xl font-sentient text-primary">₦{nairaBalance.toLocaleString()}</p>
        </div>

        {/* Total Token Balance - Clickable */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-left transition-all duration-300 hover:opacity-80"
        >
          <p className="text-xs font-mono text-foreground/50 mb-2">TOTAL TOKENS (USD)</p>
          <div className="flex justify-between items-center">
            <p className="text-3xl font-sentient text-primary">${totalBalance.toLocaleString()}</p>
            <span className="text-xs font-mono text-foreground/60">{showDetails ? "[HIDE]" : "[VIEW]"}</span>
          </div>
        </button>
      </div>

      {showDetails && (
        <div className="border border-border bg-background p-6 animate-in fade-in duration-300">
          <h3 className="text-lg font-sentient mb-6">ASSET BREAKDOWN</h3>

          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 mb-4 pb-4 border-b border-border/50">
            <div className="text-xs font-mono text-foreground/60">ASSET</div>
            <div className="text-xs font-mono text-foreground/60">SYMBOL</div>
            <div className="text-xs font-mono text-foreground/60 text-right">AMOUNT</div>
            <div className="text-xs font-mono text-foreground/60 text-right">VALUE (USD)</div>
          </div>

          {/* Table Rows */}
          <div className="space-y-3">
            {[
              { name: "Tether", symbol: "USDT", amount: 5000, value: 5000 },
              { name: "USD Coin", symbol: "USDC", amount: 3200, value: 3200 },
              { name: "Ethereum", symbol: "ETH", amount: 2.5, value: 4250 },
              { name: "Bitcoin", symbol: "BTC", amount: 0.15, value: 6750 },
              { name: "Polygon", symbol: "MATIC", amount: 1500, value: 1250 },
            ].map((asset, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-4 py-3 border-b border-border/30 last:border-0">
                <div className="text-sm font-mono text-foreground">{asset.name}</div>
                <div className="text-sm font-mono text-primary font-medium">{asset.symbol}</div>
                <div className="text-sm font-mono text-foreground text-right">
                  {asset.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm font-mono text-foreground text-right">
                  ${asset.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>

          {/* Total Row */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
            <div className="text-sm font-mono font-medium text-foreground">TOTAL</div>
            <div></div>
            <div></div>
            <div className="text-sm font-mono font-medium text-primary text-right">
              ${[5000, 3200, 4250, 6750, 1250].reduce((sum, val) => sum + val, 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
