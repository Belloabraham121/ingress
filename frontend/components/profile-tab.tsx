"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface UserProfile {
  name: string
  email: string
  walletAddress: string
  walletBalance: number
}

export function ProfileTab() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "John Doe",
    email: "john@example.com",
    walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f42e0e",
    walletBalance: 12450.5,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showWalletAddress, setShowWalletAddress] = useState(false)

  const [editForm, setEditForm] = useState({
    name: profile.name,
    email: profile.email,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setProfile({
      ...profile,
      name: editForm.name,
      email: editForm.email,
    })
    setIsEditing(false)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }

    // Simulate password change
    setPasswordSuccess("Password changed successfully")
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setIsChangingPassword(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profile.walletAddress)
  }

  return (
    <div className="space-y-6">
      {/* Wallet Information Section */}
      <div className="border border-border bg-background p-6">
        <h2 className="text-lg font-sentient mb-6">WALLET INFORMATION</h2>

        {/* Wallet Balance */}
        <div className="mb-6 pb-6 border-b border-border/50">
          <p className="text-xs font-mono text-foreground/60 mb-2">WALLET BALANCE</p>
          <p className="text-3xl font-sentient text-primary">${profile.walletBalance.toLocaleString()}</p>
        </div>

        {/* Wallet Address */}
        <div>
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-mono text-foreground/60">WALLET ADDRESS</p>
            <button
              onClick={() => setShowWalletAddress(!showWalletAddress)}
              className="text-xs font-mono text-primary hover:text-primary/80 transition-colors"
            >
              {showWalletAddress ? "[HIDE]" : "[SHOW]"}
            </button>
          </div>

          {showWalletAddress ? (
            <div className="flex items-center gap-3">
              <p className="text-sm font-mono text-foreground break-all">{profile.walletAddress}</p>
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 border border-border text-xs font-mono text-foreground/60 hover:border-primary hover:text-primary transition-colors [clip-path:polygon(2px_0,calc(100%_-_2px)_0,100%_2px,100%_calc(100%_-_2px),calc(100%_-_2px)_100%,2px_100%,0_calc(100%_-_2px),0_2px)]"
              >
                [COPY]
              </button>
            </div>
          ) : (
            <p className="text-sm font-mono text-foreground/40">••••••••••••••••••••••••••••••••••••••••</p>
          )}
        </div>
      </div>

      {/* Profile Information Section */}
      <div className="border border-border bg-background p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-sentient">PROFILE INFORMATION</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-mono text-primary hover:text-primary/80 transition-colors"
            >
              [EDIT]
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-xs font-mono text-foreground/60 mb-2">NAME</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-xs font-mono text-foreground/60 mb-2">EMAIL</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                [SAVE CHANGES]
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setEditForm({ name: profile.name, email: profile.email })
                }}
                className="flex-1 px-4 py-3 border border-border text-foreground font-mono text-sm hover:border-primary hover:text-primary transition-colors [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              >
                [CANCEL]
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-mono text-foreground/60 mb-2">NAME</p>
              <p className="text-sm font-mono text-foreground">{profile.name}</p>
            </div>
            <div>
              <p className="text-xs font-mono text-foreground/60 mb-2">EMAIL</p>
              <p className="text-sm font-mono text-foreground">{profile.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Section */}
      <div className="border border-border bg-background p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-sentient">SECURITY</h2>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="text-xs font-mono text-primary hover:text-primary/80 transition-colors"
            >
              [CHANGE PASSWORD]
            </button>
          )}
        </div>

        {isChangingPassword ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-mono text-foreground/60 mb-2">CURRENT PASSWORD</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-mono text-foreground/60 mb-2">NEW PASSWORD</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-mono text-foreground/60 mb-2">CONFIRM NEW PASSWORD</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* Error Message */}
            {passwordError && <p className="text-red-500 font-mono text-sm">{passwordError}</p>}

            {/* Success Message */}
            {passwordSuccess && <p className="text-green-500 font-mono text-sm">{passwordSuccess}</p>}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                [UPDATE PASSWORD]
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false)
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                  setPasswordError("")
                  setPasswordSuccess("")
                }}
                className="flex-1 px-4 py-3 border border-border text-foreground font-mono text-sm hover:border-primary hover:text-primary transition-colors [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              >
                [CANCEL]
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-sm font-mono text-foreground/60">Password last changed 30 days ago</p>
          </div>
        )}
      </div>
    </div>
  )
}
