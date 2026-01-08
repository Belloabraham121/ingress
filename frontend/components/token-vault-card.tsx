"use client"

interface TokenVault {
  id: string
  name: string
  symbol: string
  apy: number
  tvl: string
  minDeposit: number
  status: "active" | "paused"
  realTimeApy?: number
}

interface TokenVaultCardProps {
  vault: TokenVault
  isSelected?: boolean
  onSelect?: (vaultId: string) => void
}

export function TokenVaultCard({ vault, isSelected = false, onSelect }: TokenVaultCardProps) {
  const getStatusColor = (status: string) => {
    return status === "active" ? "text-green-500" : "text-yellow-500"
  }

  const getStatusBgColor = (status: string) => {
    return status === "active" ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30"
  }

  return (
    <button
      onClick={() => onSelect?.(vault.id)}
      className={`w-full p-6 border text-left transition-all duration-300 ${
        isSelected ? "border-primary bg-primary/5 shadow-lg" : "border-border hover:border-primary/50"
      } ${getStatusBgColor(vault.status)}`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-lg font-sentient text-foreground">{vault.name}</p>
            <p className="text-xs font-mono text-foreground/50 mt-1">{vault.symbol} Token Vault</p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-mono font-bold ${getStatusColor(vault.status)}`}>
              {vault.status.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-border/30 p-3 bg-background/50">
            <p className="text-xs font-mono text-foreground/60 mb-1">APY</p>
            <p className="text-xl font-sentient text-primary">{vault.apy}%</p>
            {vault.realTimeApy && (
              <p className="text-xs font-mono text-foreground/50 mt-1">Real-time: {vault.realTimeApy}%</p>
            )}
          </div>
          <div className="border border-border/30 p-3 bg-background/50">
            <p className="text-xs font-mono text-foreground/60 mb-1">TVL</p>
            <p className="text-xl font-sentient text-primary">{vault.tvl}</p>
          </div>
        </div>

        {/* Min Deposit */}
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-foreground/60">Min Deposit:</span>
          <span className="text-foreground">${vault.minDeposit}</span>
        </div>
      </div>
    </button>
  )
}
