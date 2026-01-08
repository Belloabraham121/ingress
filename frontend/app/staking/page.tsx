"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"
import { ChartSkeleton, TableSkeleton, SummaryCardsSkeleton } from "@/components/chart-skeleton"

// Mock data for staking performance over time
const stakingPerformanceData = [
  { month: "Jan", rewards: 0, totalStaked: 5000 },
  { month: "Feb", rewards: 25, totalStaked: 5000 },
  { month: "Mar", rewards: 52, totalStaked: 7500 },
  { month: "Apr", rewards: 85, totalStaked: 7500 },
  { month: "May", rewards: 120, totalStaked: 10000 },
  { month: "Jun", rewards: 165, totalStaked: 10000 },
  { month: "Jul", rewards: 215, totalStaked: 12500 },
]

interface StakingPosition {
  id: string
  asset: string
  amount: string
  dailyReward: string
  totalRewards: string
  apy: number
  unstakeCooldown: string
  status: "Active" | "Pending" | "Unstaking"
  startDate: string
  nextRewardDate: string
}

const stakingPositions: StakingPosition[] = [
  {
    id: "1",
    asset: "USDT",
    amount: "$5,000",
    dailyReward: "$2.50",
    totalRewards: "$75.00",
    apy: 18.25,
    unstakeCooldown: "7 days",
    status: "Active",
    startDate: "Jan 15, 2024",
    nextRewardDate: "Today",
  },
  {
    id: "2",
    asset: "USDC",
    amount: "$3,500",
    dailyReward: "$1.68",
    totalRewards: "$50.40",
    apy: 17.5,
    unstakeCooldown: "7 days",
    status: "Active",
    startDate: "Feb 20, 2024",
    nextRewardDate: "Today",
  },
  {
    id: "3",
    asset: "ETH",
    amount: "$4,000",
    dailyReward: "$4.80",
    totalRewards: "$89.60",
    apy: 43.8,
    unstakeCooldown: "14 days",
    status: "Active",
    startDate: "Mar 10, 2024",
    nextRewardDate: "Tomorrow",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "text-green-500"
    case "Pending":
      return "text-yellow-500"
    case "Unstaking":
      return "text-orange-500"
    default:
      return "text-foreground"
  }
}

const getStatusBgColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-500/10 border-green-500/30"
    case "Pending":
      return "bg-yellow-500/10 border-yellow-500/30"
    case "Unstaking":
      return "bg-orange-500/10 border-orange-500/30"
    default:
      return "bg-background border-border"
  }
}

export default function StakingPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading delay
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const totalStaked = stakingPositions.reduce((sum, pos) => {
    const value = Number.parseFloat(pos.amount.replace("$", "").replace(",", ""))
    return sum + value
  }, 0)

  const totalRewards = stakingPositions.reduce((sum, pos) => {
    const value = Number.parseFloat(pos.totalRewards.replace("$", "").replace(",", ""))
    return sum + value
  }, 0)

  const dailyRewards = stakingPositions.reduce((sum, pos) => {
    const value = Number.parseFloat(pos.dailyReward.replace("$", "").replace(",", ""))
    return sum + value
  }, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 md:px-8 lg:px-12 py-6 flex justify-between items-center">
        <Link href="/dashboard">
          <Logo className="w-[100px] md:w-[120px]" />
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">[Back to Dashboard]</Button>
        </Link>
      </div>

      <main className="pt-12 pb-16">
        <div className="container">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-sentient mb-4">
              Staking <i className="font-light">Activities</i>
            </h1>
            <p className="font-mono text-sm text-foreground/60 max-w-[500px]">
              Monitor your staking positions, track daily rewards, and manage your passive income streams
            </p>
          </div>

          {/* Summary Cards */}
          {isLoading ? (
            <SummaryCardsSkeleton count={4} className="mb-12" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">TOTAL STAKED</p>
                <p className="text-2xl font-sentient text-primary">${totalStaked.toFixed(2)}</p>
              </div>
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">TOTAL REWARDS EARNED</p>
                <p className="text-2xl font-sentient text-green-500">${totalRewards.toFixed(2)}</p>
              </div>
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">DAILY REWARDS</p>
                <p className="text-2xl font-sentient text-primary">${dailyRewards.toFixed(2)}</p>
              </div>
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">ACTIVE POSITIONS</p>
                <p className="text-2xl font-sentient text-primary">{stakingPositions.length}</p>
              </div>
            </div>
          )}

          {/* Rewards Chart */}
          <div className="border border-border bg-background p-6 mb-12">
            <h2 className="text-lg font-sentient mb-6">STAKING REWARDS OVER TIME</h2>
            {isLoading ? (
              <ChartSkeleton height="h-[400px]" showLegend={true} />
            ) : (
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stakingPerformanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRewards" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFC700" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FFC700" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#424242" />
                    <XAxis dataKey="month" stroke="#ffffff" />
                    <YAxis stroke="#ffffff" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#000000",
                        border: "1px solid #424242",
                        color: "#ffffff",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="rewards"
                      stroke="#FFC700"
                      fillOpacity={1}
                      fill="url(#colorRewards)"
                      name="Rewards Earned"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalStaked"
                      stroke="#ffffff"
                      strokeDasharray="5 5"
                      name="Total Staked"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Staking Positions Table */}
          <div className="border border-border bg-background p-6 mb-12">
            <h2 className="text-lg font-sentient mb-6">STAKING POSITIONS</h2>
            {isLoading ? (
              <TableSkeleton rows={3} columns={8} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-mono">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-3 text-foreground/60 font-medium">ASSET</th>
                      <th className="text-right p-3 text-foreground/60 font-medium">AMOUNT</th>
                      <th className="text-right p-3 text-foreground/60 font-medium">DAILY REWARD</th>
                      <th className="text-right p-3 text-foreground/60 font-medium">TOTAL REWARDS</th>
                      <th className="text-right p-3 text-foreground/60 font-medium">APY</th>
                      <th className="text-right p-3 text-foreground/60 font-medium">COOLDOWN</th>
                      <th className="text-right p-3 text-foreground/60 font-medium">STATUS</th>
                      <th className="text-right p-3 text-foreground/60 font-medium">STARTED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stakingPositions.map((position) => (
                      <tr key={position.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                        <td className="p-3 text-foreground font-bold">{position.asset}</td>
                        <td className="text-right p-3 text-foreground">{position.amount}</td>
                        <td className="text-right p-3 text-green-500 font-bold">{position.dailyReward}</td>
                        <td className="text-right p-3 text-foreground">{position.totalRewards}</td>
                        <td className="text-right p-3 text-primary font-bold">{position.apy}%</td>
                        <td className="text-right p-3 text-foreground/60">{position.unstakeCooldown}</td>
                        <td className={`text-right p-3 font-bold ${getStatusColor(position.status)}`}>
                          {position.status}
                        </td>
                        <td className="text-right p-3 text-foreground/60">{position.startDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Individual Staking Cards */}
          <div className="mb-12">
            <h2 className="text-lg font-sentient mb-6">STAKING BREAKDOWN</h2>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="border border-border bg-background p-6">
                    <div className="h-6 w-32 rounded bg-gradient-to-r from-border/20 to-border/40 mb-4 animate-pulse" />
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div key={`line-${j}`} className="flex justify-between">
                          <div className="h-4 w-20 rounded bg-gradient-to-r from-border/20 to-border/40 animate-pulse" />
                          <div className="h-4 w-24 rounded bg-gradient-to-r from-border/20 to-border/40 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stakingPositions.map((position) => (
                  <div key={position.id} className={`border p-6 ${getStatusBgColor(position.status)}`}>
                    <h3 className="text-base font-sentient mb-4">{position.asset} Staking</h3>
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Amount Staked:</span>
                        <span className="text-foreground font-bold">{position.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Daily Reward:</span>
                        <span className="text-green-500 font-bold">{position.dailyReward}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Total Rewards:</span>
                        <span className="text-foreground">{position.totalRewards}</span>
                      </div>
                      <div className="border-t border-current/20 pt-3 flex justify-between">
                        <span className="text-foreground/60">APY:</span>
                        <span className="text-primary font-bold">{position.apy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Unstake Cooldown:</span>
                        <span className="text-foreground/80">{position.unstakeCooldown}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Status:</span>
                        <span className={`font-bold ${getStatusColor(position.status)}`}>{position.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Next Reward:</span>
                        <span className="text-foreground/80">{position.nextRewardDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button variant="outline">[BACK TO DASHBOARD]</Button>
            </Link>
            <Button>[ADD NEW STAKE]</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
