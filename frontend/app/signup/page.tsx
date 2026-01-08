"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"

export default function SignUp() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Name is required")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)

    // Simulate account creation delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Redirect to dashboard on successful sign-up
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Logo Only - No Navigation */}
      <div className="pt-8 md:pt-14 px-4 md:px-8 lg:px-12">
        <Link href="/">
          <Logo className="w-[100px] md:w-[120px]" />
        </Link>
      </div>

      {/* Sign Up Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-sentient mb-4">Create Account</h1>
            <p className="font-mono text-sm text-foreground/60">Join Skal Ventures and start investing</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-6">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block font-mono text-sm text-foreground/80 mb-3">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block font-mono text-sm text-foreground/80 mb-3">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block font-mono text-sm text-foreground/80 mb-3">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block font-mono text-sm text-foreground/80 mb-3">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
              />
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500 font-mono text-sm">{error}</p>}

            {/* Sign Up Button */}
            <Button type="submit" disabled={isLoading} className="w-full mt-8">
              {isLoading ? "[Creating Account...]" : "[Create Account]"}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-4">
            <p className="font-mono text-sm text-foreground/60">
              Already have an account?{" "}
              <Link href="/signin" className="text-primary hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </p>
            <Link
              href="/"
              className="inline-block font-mono text-sm text-foreground/60 hover:text-foreground/100 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
