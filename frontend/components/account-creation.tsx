"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface GeneratedAccount {
  accountNumber: string
  bankName: string
  accountName: string
}

export function AccountCreation() {
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
  )
}
