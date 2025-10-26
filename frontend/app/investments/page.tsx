"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"

// Mock data for portfolio performance over time
const performanceData = [
  { month: "Jan", value: 8000, invested: 8000 },
  { month: "Feb", value: 8450, invested: 8000 },
  { month: "Mar", value: 9200, invested: 10200 },
  { month: "Apr", value: 9850, invested: 10200 },
  { month: "May", value: 10500, invested: 10200 },
  { month: "Jun", value: 11200, invested: 12200 },
  { month: "Jul", value: 12450, invested: 12450 },
]

interface InvestmentPosition {
  id: string
  strategy: string
  amount: string
  apy: number
  projectedAnnualReturn: string
  currentValue: string
  riskLevel: "Low" | "Medium" | "High"
  gainLoss: string
  gainLossPercent: number
  startDate: string
}

const investmentPositions: InvestmentPosition[] = [
  {
    id: "1",
    strategy: "Conservative Fund",
    amount: "$2,000",
    apy: 8.5,
    projectedAnnualReturn: "$170",
    currentValue: "$2,085",
    riskLevel: "Low",
    gainLoss: "$85",
    gainLossPercent: 4.25,
    startDate: "Jan 15, 2024",
  },
  {
    id: "2",
    strategy: "Balanced Fund",
    amount: "$4,200",
    apy: 12.3,
    projectedAnnualReturn: "$516.60",
    currentValue: "$4,650",
    riskLevel: "Medium",
    gainLoss: "$450",
    gainLossPercent: 10.71,
    startDate: "Feb 20, 2024",
  },
  {
    id: "3",
    strategy: "Growth Fund",
    amount: "$6,250",
    apy: 18.7,
    projectedAnnualReturn: "$1,168.75",
    currentValue: "$7,715",
    riskLevel: "High",
    gainLoss: "$1,465",
    gainLossPercent: 23.44,
    startDate: "Mar 10, 2024",
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

const getRiskBgColor = (risk: string) => {
  switch (risk) {
    case "Low":
      return "bg-green-500/10 border-green-500/30"
    case "Medium":
      return "bg-yellow-500/10 border-yellow-500/30"
    case "High":
      return "bg-red-500/10 border-red-500/30"
    default:
      return "bg-background border-border"
  }
}

export default function InvestmentsPage() {
  const totalInvested = investmentPositions.reduce((sum, pos) => {
    const value = Number.parseFloat(pos.amount.replace("$", "").replace(",", ""))
    return sum + value
  }, 0)

  const totalCurrentValue = investmentPositions.reduce((sum, pos) => {
    const value = Number.parseFloat(pos.currentValue.replace("$", "").replace(",", ""))
    return sum + value
  }, 0)

  const totalGainLoss = investmentPositions.reduce((sum, pos) => {
    const value = Number.parseFloat(pos.gainLoss.replace("$", "").replace(",", ""))
    return sum + value
  }, 0)

  const totalGainLossPercent = ((totalGainLoss / totalInvested) * 100).toFixed(2)

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
              Investment <i className="font-light">Portfolio</i>
            </h1>
            <p className="font-mono text-sm text-foreground/60 max-w-[500px]">
              Comprehensive overview of your investment strategies and performance metrics
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="border border-border bg-background p-6">
              <p className="text-xs font-mono text-foreground/60 mb-2">TOTAL INVESTED</p>
              <p className="text-2xl font-sentient text-primary">${totalInvested.toFixed(2)}</p>
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

          {/* Performance Chart */}
          <div className="border border-border bg-background p-6 mb-12">
            <h2 className="text-lg font-sentient mb-6">PORTFOLIO PERFORMANCE</h2>
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
                    name="Portfolio Value"
                  />
                  <Line
                    type="monotone"
                    dataKey="invested"
                    stroke="#ffffff"
                    strokeDasharray="5 5"
                    name="Total Invested"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Investments Table */}
          <div className="border border-border bg-background p-6 mb-12">
            <h2 className="text-lg font-sentient mb-6">INVESTMENT DETAILS</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-3 text-foreground/60 font-medium">STRATEGY</th>
                    <th className="text-right p-3 text-foreground/60 font-medium">INVESTED</th>
                    <th className="text-right p-3 text-foreground/60 font-medium">CURRENT VALUE</th>
                    <th className="text-right p-3 text-foreground/60 font-medium">GAIN/LOSS</th>
                    <th className="text-right p-3 text-foreground/60 font-medium">RETURN %</th>
                    <th className="text-right p-3 text-foreground/60 font-medium">APY</th>
                    <th className="text-right p-3 text-foreground/60 font-medium">RISK</th>
                    <th className="text-right p-3 text-foreground/60 font-medium">START DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {investmentPositions.map((position) => (
                    <tr key={position.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                      <td className="p-3 text-foreground">{position.strategy}</td>
                      <td className="text-right p-3 text-foreground">{position.amount}</td>
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
                      <td className={`text-right p-3 font-bold ${getRiskColor(position.riskLevel)}`}>
                        {position.riskLevel}
                      </td>
                      <td className="text-right p-3 text-foreground/60">{position.startDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Individual Investment Cards */}
          <div className="mb-12">
            <h2 className="text-lg font-sentient mb-6">INVESTMENT BREAKDOWN</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {investmentPositions.map((position) => (
                <div key={position.id} className={`border p-6 ${getRiskBgColor(position.riskLevel)}`}>
                  <h3 className="text-base font-sentient mb-4">{position.strategy}</h3>
                  <div className="space-y-3 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Invested:</span>
                      <span className="text-foreground">{position.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Current Value:</span>
                      <span className="text-foreground">{position.currentValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Gain/Loss:</span>
                      <span
                        className={Number(position.gainLoss.replace("$", "")) >= 0 ? "text-green-500" : "text-red-500"}
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
                    <div className="border-t border-current/20 pt-3 flex justify-between">
                      <span className="text-foreground/60">APY:</span>
                      <span className="text-primary font-bold">{position.apy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Risk Level:</span>
                      <span className={`font-bold ${getRiskColor(position.riskLevel)}`}>{position.riskLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/60">Started:</span>
                      <span className="text-foreground/80">{position.startDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button variant="outline">[BACK TO DASHBOARD]</Button>
            </Link>
            <Button>[ADD NEW INVESTMENT]</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
