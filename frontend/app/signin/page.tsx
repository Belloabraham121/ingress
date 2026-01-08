"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/useAuth";

export default function SignIn() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Call the actual API
      const response = await login({ email, password });

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Logo Only - No Navigation */}
      <div className="pt-8 md:pt-14 px-4 md:px-8 lg:px-12">
        <Link href="/">
          <Logo className="w-[100px] md:w-[120px]" />
        </Link>
      </div>

      {/* Sign In Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-sentient mb-4">Sign In</h1>
            <p className="font-mono text-sm text-foreground/60">
              Access your blockchain investment dashboard
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-sm text-foreground/80 mb-3"
              >
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
              <label
                htmlFor="password"
                className="block font-mono text-sm text-foreground/80 mb-3"
              >
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

            {/* Error Message */}
            {error && <p className="text-red-500 font-mono text-sm">{error}</p>}

            {/* Sign In Button */}
            <Button type="submit" disabled={isLoading} className="w-full mt-8">
              {isLoading ? "[Signing In...]" : "[Sign In]"}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-4">
            <p className="font-mono text-sm text-foreground/60">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Create one
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
  );
}
