"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface GeneratedAccount {
  accountNumber: string
  bankName: string
  accountName: string
}

interface Transaction {
  id: string
  date: string
  type: "deposit" | "withdrawal" | "swap"
  description: string
  amount: string
  status: "completed" | "pending" | "failed"
}

const transactions: Transaction[] = [
  {
    id: "1",
    date: "2024-01-15",
    type: "deposit",
    description: "Deposit from Bank Account",
    amount: "+$5,000.00",
    status: "completed",
  },
  {
    id: "2",
    date: "2024-01-14",
    type: "swap",
    description: "Swapped 50,000 NGN to USDT",
    amount: "+$125.50",
    status: "completed",
  },
  {
    id: "3",
    date: "2024-01-13",
    type: "withdrawal",
    description: "Withdrawal to Bank Account",
    amount: "-$2,000.00",
    status: "completed",
  },
  {
    id: "4",
    date: "2024-01-12",
    type: "deposit",
    description: "Deposit from Bank Account",
    amount: "+$1,500.00",
    status: "completed",
  },
  {
    id: "5",
    date: "2024-01-11",
    type: "swap",
    description: "Swapped USDT to USDC",
    amount: "+$3,200.00",
    status: "pending",
  },
  {
    id: "6",
    date: "2024-01-10",
    type: "withdrawal",
    description: "Withdrawal to Bank Account",
    amount: "-$500.00",
    status: "completed",
  },
]

function getStatusColor(status: Transaction["status"]) {
  switch (status) {
    case "completed":
      return "text-green-500"
    case "pending":
      return "text-yellow-500"
    case "failed":
      return "text-red-500"
    default:
      return "text-foreground/60"
  }
}

function getTypeLabel(type: Transaction["type"]) {
  switch (type) {
    case "deposit":
      return "[DEPOSIT]"
    case "withdrawal":
      return "[WITHDRAWAL]"
    case "swap":
      return "[SWAP]"
    default:
      return type
  }
}

export function AccountDepositsTab() {
  const [bvn, setBvn] = useState("")
  const [nin, setNin] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [generatedAccount, setGeneratedAccount] = useState<GeneratedAccount | null>(null)

  const handleGenerateAccount = () => {
    if (bvn.trim() && nin.trim()) {
      // Simulate account generation
      const accountNumber = `${Math.random().toString().slice(2, 12)}`
      setGeneratedAccount({
        accountNumber,
        bankName: "Skal Ventures Bank",
        accountName: "Skal User Account",
      })
      setIsSubmitted(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Account Setup Section */}
      <div className="border border-border bg-background p-6">
        <h3 className="text-lg font-sentient mb-6">ACCOUNT SETUP</h3>

        {!isSubmitted ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-foreground/60 mb-2">BVN (Bank Verification Number)</label>
              <Input
                type="text"
                placeholder="Enter your BVN"
                value={bvn}
                onChange={(e) => setBvn(e.target.value)}
                className="border border-border bg-background text-foreground placeholder:text-foreground/40 focus:border-primary"
                maxLength={11}
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-foreground/60 mb-2">
                NIN (National Identification Number)
              </label>
              <Input
                type="text"
                placeholder="Enter your NIN"
                value={nin}
                onChange={(e) => setNin(e.target.value)}
                className="border border-border bg-background text-foreground placeholder:text-foreground/40 focus:border-primary"
                maxLength={11}
              />
            </div>

            <Button onClick={handleGenerateAccount} disabled={!bvn.trim() || !nin.trim()} className="w-full">
              [GENERATE ACCOUNT]
            </Button>
          </div>
        ) : generatedAccount ? (
          <div className="space-y-4">
            <div className="border border-border/50 p-4 space-y-3">
              <div>
                <p className="text-xs font-mono text-foreground/60 mb-1">ACCOUNT NUMBER</p>
                <p className="text-lg font-sentient text-primary">{generatedAccount.accountNumber}</p>
              </div>

              <div className="border-t border-border/50 pt-3">
                <p className="text-xs font-mono text-foreground/60 mb-1">BANK NAME</p>
                <p className="text-sm font-mono text-foreground">{generatedAccount.bankName}</p>
              </div>

              <div className="border-t border-border/50 pt-3">
                <p className="text-xs font-mono text-foreground/60 mb-1">ACCOUNT NAME</p>
                <p className="text-sm font-mono text-foreground">{generatedAccount.accountName}</p>
              </div>
            </div>

            <p className="text-xs font-mono text-green-500">
              Account successfully created. Use this account number for deposits.
            </p>

            <Button
              onClick={() => {
                setIsSubmitted(false)
                setBvn("")
                setNin("")
                setGeneratedAccount(null)
              }}
              variant="outline"
              className="w-full"
            >
              [CREATE NEW ACCOUNT]
            </Button>
          </div>
        ) : null}
      </div>

      {/* Transaction History Section */}
      <div className="border border-border bg-background p-6">
        <h3 className="text-lg font-sentient mb-6">TRANSACTION HISTORY</h3>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-5 gap-4 mb-4 pb-4 border-b border-border/50">
          <div className="text-xs font-mono text-foreground/60">DATE</div>
          <div className="text-xs font-mono text-foreground/60">TYPE</div>
          <div className="text-xs font-mono text-foreground/60">DESCRIPTION</div>
          <div className="text-xs font-mono text-foreground/60 text-right">AMOUNT</div>
          <div className="text-xs font-mono text-foreground/60 text-right">STATUS</div>
        </div>

        {/* Table Rows */}
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="grid md:grid-cols-5 gap-4 py-4 border-b border-border/30 last:border-0 md:items-center"
            >
              {/* Mobile: Full width layout */}
              <div className="md:hidden space-y-2 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-mono text-foreground/60">DATE</p>
                    <p className="text-sm font-mono text-foreground">{transaction.date}</p>
                  </div>
                  <p className={`text-xs font-mono font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-foreground/60">TYPE</p>
                  <p className="text-sm font-mono text-primary">{getTypeLabel(transaction.type)}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-foreground/60">DESCRIPTION</p>
                  <p className="text-sm font-mono text-foreground">{transaction.description}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-foreground/60">AMOUNT</p>
                  <p className="text-sm font-mono text-foreground font-medium">{transaction.amount}</p>
                </div>
              </div>

              {/* Desktop: Grid layout */}
              <div className="hidden md:block">
                <p className="text-sm font-mono text-foreground">{transaction.date}</p>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-mono text-primary font-medium">{getTypeLabel(transaction.type)}</p>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-mono text-foreground">{transaction.description}</p>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-sm font-mono text-foreground font-medium">{transaction.amount}</p>
              </div>
              <div className="hidden md:block text-right">
                <p className={`text-xs font-mono font-medium ${getStatusColor(transaction.status)}`}>
                  {transaction.status.toUpperCase()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
