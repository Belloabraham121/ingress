"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StakeConfirmationModal } from "@/components/stake-confirmation-modal"

interface StakingPool {
  id: string
  token: string
  apy: number
  totalStaked: string
  yourStake: string
}

const stakingPools: StakingPool[] = [
  { id: "1", token: "USDT", apy: 6.5, totalStaked: "$2.5M", yourStake: "$0" },
  { id: "2", token: "USDC", apy: 7.2, totalStaked: "$1.8M", yourStake: "$0" },
  { id: "3", token: "ETH", apy: 4.8, totalStaked: "$850K", yourStake: "$0" },
]

export function StakeCard() {
  const [selectedPool, setSelectedPool] = useState<string>("1")
  const [stakeAmount, setStakeAmount] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)

  const pool = stakingPools.find((p) => p.id === selectedPool)
  const dailyRewards = pool ? ((Number.parseFloat(stakeAmount || "0") * (pool.apy / 100)) / 365).toFixed(4) : "0.0000"

  const handleStakeClick = () => {
    if (stakeAmount && Number.parseFloat(stakeAmount) > 0) {
      setShowConfirmation(true)
    }
  }

  const handleConfirmStake = () => {
    setShowConfirmation(false)
    setStakeAmount("")
    // Here you would typically make an API call to process the stake
  }

  return (
    <>
      <div className="border border-border bg-background p-6 space-y-6">
        <div>
          <label className="block text-sm font-mono text-foreground/60 mb-3">SELECT STAKING POOL</label>
          <div className="space-y-2">
            {stakingPools.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPool(p.id)}
                className={`w-full p-4 border text-left transition-colors ${
                  selectedPool === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono font-medium text-foreground">{p.token} Pool</p>
                    <p className="text-xs font-mono text-foreground/50 mt-1">Total Staked: {p.totalStaked}</p>
                  </div>
                  <p className="text-primary font-mono font-bold">{p.apy}% APY</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-mono text-foreground/60 mb-3">STAKE AMOUNT ({pool?.token})</label>
          <Input
            type="number"
            placeholder="0.00"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            className="bg-background border-border text-foreground placeholder:text-foreground/30"
          />
        </div>

        <div className="border border-border/50 p-4 space-y-2">
          <div className="flex justify-between text-sm font-mono">
            <span className="text-foreground/60">Daily Rewards:</span>
            <span className="text-primary">
              {dailyRewards} {pool?.token}
            </span>
          </div>
          <div className="flex justify-between text-sm font-mono">
            <span className="text-foreground/60">Unstake Cooldown:</span>
            <span className="text-foreground">7 days</span>
          </div>
          <div className="flex justify-between text-sm font-mono">
            <span className="text-foreground/60">Your Current Stake:</span>
            <span className="text-foreground">{pool?.yourStake}</span>
          </div>
        </div>

        <Button
          onClick={handleStakeClick}
          disabled={!stakeAmount || Number.parseFloat(stakeAmount) <= 0}
          className="w-full"
        >
          [STAKE NOW]
        </Button>
      </div>

      <StakeConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmStake}
        token={pool?.token || ""}
        amount={stakeAmount}
        apy={pool?.apy || 0}
        dailyRewards={`${dailyRewards} ${pool?.token}`}
        unstakeCooldown="7 days"
      />
    </>
  )
}
