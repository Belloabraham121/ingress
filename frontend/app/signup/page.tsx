"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { AccountCreation } from "@/components/account-creation";
import { useAuth } from "@/hooks/useAuth";

export default function SignUp() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"credentials" | "account">("credentials");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }

    if (!lastName.trim()) {
      setError("Last name is required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      // Call the actual API
      const response = await register({
        firstName,
        lastName,
        email,
        password,
      });

      // Success - move to account setup step
      setStep("account");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    }
  };

  const handleAccountSetupComplete = () => {
    // Redirect to dashboard after account setup
    router.push("/dashboard");
  };

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
          {step === "credentials" ? (
            <>
              <div className="mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-sentient mb-4">
                  Create Account
                </h1>
                <p className="font-mono text-sm text-foreground/60">
                  Join Ingress
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-6">
                {/* First Name Input */}
                <div>
                  <label
                    htmlFor="firstName"
                    className="block font-mono text-sm text-foreground/80 mb-3"
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                    className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
                  />
                </div>

                {/* Last Name Input */}
                <div>
                  <label
                    htmlFor="lastName"
                    className="block font-mono text-sm text-foreground/80 mb-3"
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                    className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors duration-150 [clip-path:polygon(4px_0,calc(100%_-_4px)_0,100%_4px,100%_calc(100%_-_4px),calc(100%_-_4px)_100%,4px_100%,0_calc(100%_-_4px),0_4px)]"
                  />
                </div>

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

                {/* Confirm Password Input */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block font-mono text-sm text-foreground/80 mb-3"
                  >
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
                {error && (
                  <p className="text-red-500 font-mono text-sm">{error}</p>
                )}

                {/* Sign Up Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-8"
                >
                  {isLoading ? "[Creating Account...]" : "[Create Account]"}
                </Button>
              </form>

              {/* Footer Links */}
              <div className="mt-8 text-center space-y-4">
                <p className="font-mono text-sm text-foreground/60">
                  Already have an account?{" "}
                  <Link
                    href="/signin"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
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
            </>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-4xl md:text-5xl font-sentient mb-4">
                  Account Setup
                </h1>
                <p className="font-mono text-sm text-foreground/60">
                  Complete your account setup to get started
                </p>
              </div>

              <AccountCreation />

              <div className="mt-8 text-center">
                <Button onClick={handleAccountSetupComplete} className="w-full">
                  [CONTINUE TO DASHBOARD]
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
