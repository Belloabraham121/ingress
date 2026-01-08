"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"
import { ChartSkeleton, TableSkeleton, SummaryCardsSkeleton } from "@/components/chart-skeleton"

const performanceData = [
  { month: "Jan", value: 8000, deposited: 8000 },
  { month: "Feb", value: 8520, deposited: 8000 },
  { month: "Mar", value: 9350, deposited: 11500 },
  { month: "Apr", value: 10120, deposited: 11500 },
  { month: "May", value: 10890, deposited: 11500 },
  { month: "Jun", value: 11750, deposited: 13250 },
  { month: "Jul", value: 12680, deposited: 13250 },
]

interface VaultPosition {
  id: string
  vaultName: string
  symbol: string
  depositAmount: string
  apy: number
  realTimeApy: number
  projectedAnnualReturn: string
  currentValue: string
  gainLoss: string
  gainLossPercent: number
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
    currentValue: "$2,085",
    gainLoss: "$85",
    gainLossPercent: 4.25,
    depositDate: "Jan 15, 2024",
  },
  {
    id: "2",
    vaultName: "USDC Vault",
    symbol: "USDC",
    depositAmount: "$4,200",
    apy: 11.8,
    realTimeApy: 11.9,
    projectedAnnualReturn: "$495.60",
    currentValue: "$4,650",
    gainLoss: "$450",
    gainLossPercent: 10.71,
    depositDate: "Feb 20, 2024",
  },
  {
    id: "3",
    vaultName: "ETH Vault",
    symbol: "ETH",
    depositAmount: "$6,250",
    apy: 8.2,
    realTimeApy: 8.3,
    projectedAnnualReturn: "$512.50",
    currentValue: "$7,715",
    gainLoss: "$1,465",
    gainLossPercent: 23.44,
    depositDate: "Mar 10, 2024",
  },
]

export default function InvestmentsPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading delay
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const totalDeposited = vaultPositions.reduce((sum, pos) => {
    const value = Number.parseFloat(pos.depositAmount.replace("$", "").replace(",", ""))
    return sum + value
  }, 0)

  const totalCurrentValue = vaultPositions.reduce((sum, pos) => {
    const value = Number.parseFloat(pos.currentValue.replace("$", "").replace(",", ""))
    return sum + value
  }, 0)

  const totalGainLoss = vaultPositions.reduce((sum, pos) => {
    const value = Number.parseFloat(pos.gainLoss.replace("$", "").replace(",", ""))
    return sum + value
  }, 0)

  const totalGainLossPercent = ((totalGainLoss / totalDeposited) * 100).toFixed(2)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 md:px-8 lg:px-12 py-6 flex justify-between items-center">
        <Link href="/dashboard">
          <Logo className="w-[100px] md:w-[120px]" />
        </Link>
        <div className="flex gap-3">
          <Link href="/staking">
            <Button variant="outline">[View Staking]</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">[Back to Dashboard]</Button>
          </Link>
        </div>
      </div>

      <main className="pt-12 pb-16">
        <div className="container">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-sentient mb-4">
              Token <i className="font-light">Vault System</i>
            </h1>
            <p className="font-mono text-sm text-foreground/60 max-w-[500px]">
              Deposit your tokens into secure vaults and earn real-time APY rewards with flexible withdrawal options
            </p>
          </div>

          {/* Summary Cards */}
          {isLoading ? (
            <SummaryCardsSkeleton count={4} className="mb-12" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">TOTAL DEPOSITED</p>
                <p className="text-2xl font-sentient text-primary">${totalDeposited.toFixed(2)}</p>
              </div>
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">CURRENT VALUE</p>
                <p className="text-2xl font-sentient text-primary">${totalCurrentValue.toFixed(2)}</p>
              </div>
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">TOTAL GAIN/LOSS</p>
                <p className={`text-2xl font-sentient ${totalGainLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                  ${totalGainLoss.toFixed(2)}
                </p>
              </div>
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">RETURN %</p>
                <p
                  className={`text-2xl font-sentient ${Number(totalGainLossPercent) >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {totalGainLossPercent}%
                </p>
              </div>
            </div>
          )}

          {/* Performance Chart */}
          <div className="border border-border bg-background p-6 mb-12">
            <h2 className="text-lg font-sentient mb-6">VAULT PERFORMANCE</h2>
            {isLoading ? (
              <ChartSkeleton height="h-[400px]" showLegend={true} />
            ) : (
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
                      dataKey="value"
                      stroke="#FFC700"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      name="Vault Value"
                    />
                    <Line
                      type="monotone"
                      dataKey="deposited"
                      stroke="#ffffff"
                      strokeDasharray="5 5"
                      name="Total Deposited"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Detailed Vaults Table */}
          <div className="border border-border bg-background p-6 mb-12">
            <h2 className="text-lg font-sentient mb-6">VAULT DETAILS</h2>
            {isLoading ? (
              <TableSkeleton rows={3} columns={8} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-mono">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-3 text-foreground/60 font-medium">VAULT</th>
                      <th className="text-right p-3 text-foreground/60 font-medium">DEPOSITED</th>
                      <th className="text-right p-3 text-foreground/60 font-medium">CURRENT VALUE</th>
                      <th className="text-right p-3 text-foreground/60 font-medium">GAIN/LOSS</th>
                      <th className="text-right p-3 text-foreground/60 font-medium">RETURN %</th>
                      <th className="text-right p-3 text-foreground/60 font-medium">APY</th>
                      <th className="text-right p-3 text-foreground/60 font-medium">REAL-TIME APY</th>
                      <th className="text-right p-3 text-foreground/60 font-medium">DEPOSIT DATE</th>
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
                        <td className="text-right p-3 text-foreground">{position.currentValue}</td>
                        <td
                          className={`text-right p-3 font-bold ${Number(position.gainLoss.replace("$", "")) >= 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {position.gainLoss}
                        </td>
                        <td
                          className={`text-right p-3 font-bold ${position.gainLossPercent >= 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {position.gainLossPercent.toFixed(2)}%
                        </td>
                        <td className="text-right p-3 text-primary font-bold">{position.apy}%</td>
                        <td className="text-right p-3 text-green-500 font-bold">{position.realTimeApy}%</td>
                        <td className="text-right p-3 text-foreground/60">{position.depositDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Individual Vault Cards */}
          <div className="mb-12">
            <h2 className="text-lg font-sentient mb-6">VAULT BREAKDOWN</h2>
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
                {vaultPositions.map((position) => (
                  <div
                    key={position.id}
                    className="border border-border bg-background p-6 hover:border-primary/50 transition-colors"
                  >
                    <h3 className="text-base font-sentient mb-4">{position.vaultName}</h3>
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Token:</span>
                        <span className="text-foreground font-medium">{position.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Deposited:</span>
                        <span className="text-foreground">{position.depositAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Current Value:</span>
                        <span className="text-foreground">{position.currentValue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Gain/Loss:</span>
                        <span
                          className={
                            Number(position.gainLoss.replace("$", "")) >= 0 ? "text-green-500" : "text-red-500"
                          }
                        >
                          {position.gainLoss}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Return:</span>
                        <span className={position.gainLossPercent >= 0 ? "text-green-500" : "text-red-500"}>
                          {position.gainLossPercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="border-t border-border/50 pt-3 flex justify-between">
                        <span className="text-foreground/60">APY:</span>
                        <span className="text-primary font-bold">{position.apy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Real-time APY:</span>
                        <span className="text-green-500 font-bold">{position.realTimeApy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/60">Deposited:</span>
                        <span className="text-foreground/80">{position.depositDate}</span>
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
            <Button>[DEPOSIT TO VAULT]</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
