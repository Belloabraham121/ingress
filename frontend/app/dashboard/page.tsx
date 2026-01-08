"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SwapCard } from "@/components/swap-card";
import { InvestCard } from "@/components/invest-card";
import { StakeCard } from "@/components/stake-card";
import { WalletCard } from "@/components/wallet-card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { AccountDepositsTab } from "@/components/account-deposits-tab";
import { ProfileTab } from "@/components/profile-tab";
import { StakingOverview } from "@/components/staking-overview";
import { InvestmentOverview } from "@/components/investment-overview";
import { RecentActivityCard } from "@/components/recent-activity-card";
import { useAuth } from "@/hooks/useAuth";
import { getEvmAddressFromAccountId } from "@/lib/hedera-utils";
import { useUserVaultPositions } from "@/hooks/useUserVaultPositions";
import { useUserStakingPositions } from "@/hooks/useUserStakingPositions";
import { useRouter } from "next/navigation";

type TabType = "swap" | "invest" | "stake" | "account" | "profile";

export default function DashboardPage() {
  const router = useRouter();
  const { logout, getProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("swap");
  const [userName, setUserName] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [evmAddress, setEvmAddress] = useState<string>("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await getProfile();
      setUserName(`${profile.user.firstName} ${profile.user.lastName}`);
      const acctId = profile.wallet.accountId || "";
      setAccountId(acctId);
      if (acctId) {
        const evm = await getEvmAddressFromAccountId(acctId);
        setEvmAddress(evm);
      }
    } catch (err) {
      // If not authenticated, redirect to login
      router.push("/signin");
    }
  };

  const { summary, positions } = useUserVaultPositions(evmAddress);
  const { summary: stakingSummary } = useUserStakingPositions(evmAddress);

  const portfolioValue = (() => {
    const vaultCurrent = summary ? Number(summary.totalCurrentValue) : 0;
    const vaultProfit = summary ? Number(summary.totalProjectedReturn) : 0;
    const stakingTotal = stakingSummary ? Number(stakingSummary.totalValue) : 0;
    return vaultCurrent + vaultProfit + stakingTotal;
  })();

  const handleLogout = () => {
    logout();
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "swap", label: "[SWAP]" },
    { id: "invest", label: "[INVEST]" },
    { id: "stake", label: "[STAKE]" },
    { id: "account", label: "[ACCOUNT & DEPOSITS]" },
    { id: "profile", label: "[PROFILE]" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-4 md:px-8 lg:px-12 py-6 flex justify-between items-center">
        <Link href="/">
          <Logo className="w-[100px] md:w-[120px]" />
        </Link>
        <div className="flex items-center gap-4">
          {userName && (
            <span className="text-sm font-mono text-foreground/60 hidden md:block">
              {userName}
            </span>
          )}
          <Button onClick={handleLogout}>[Sign Out]</Button>
        </div>
      </div>

      <main className="pt-12 pb-16">
        <div className="container">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-sentient mb-4">
              Asset <i className="font-light">Management</i>
            </h1>
            <p className="font-mono text-sm text-foreground/60 max-w-[500px]">
              Swap currencies, invest in strategies, and stake your assets to
              maximize returns
            </p>
          </div>

          <div className="mb-8 flex gap-3 flex-wrap">
            <Link href="/investments">
              <Button>[View Investment Activities]</Button>
            </Link>
            <Link href="/staking">
              <Button>[View Staking Activities]</Button>
            </Link>
          </div>

          <div className="mb-12">
            <WalletCard />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            <StakingOverview />
            <InvestmentOverview />
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-3 mb-8 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 border font-mono text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground/60 hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Card */}
            <div className="lg:col-span-2">
              {activeTab === "swap" && <SwapCard />}
              {activeTab === "invest" && <InvestCard />}
              {activeTab === "stake" && <StakeCard />}
              {activeTab === "account" && <AccountDepositsTab />}
              {activeTab === "profile" && <ProfileTab />}
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-4">
              {/* Portfolio Value */}
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">
                  PORTFOLIO VALUE
                </p>
                <p className="text-3xl font-sentient text-primary mb-2">
                  $
                  {portfolioValue.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs font-mono text-foreground/50">
                  Vault Value $
                  {summary
                    ? Number(summary.totalCurrentValue).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 }
                      )
                    : "0.00"}
                  {" · "}Vault Profit $
                  {summary
                    ? Number(summary.totalProjectedReturn).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 }
                      )
                    : "0.00"}
                  {" · "}Staked Value $
                  {stakingSummary
                    ? Number(stakingSummary.totalValue).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 }
                      )
                    : "0.00"}
                </p>
              </div>

              {/* Active Positions */}
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-4">
                  ACTIVE VAULT POSITIONS
                </p>
                <div className="space-y-3">
                  {positions && positions.length > 0 ? (
                    positions.map((pos) => (
                      <div
                        key={pos.vaultAddress}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm font-mono">
                          {pos.vaultName}
                        </span>
                        <span className="text-sm font-mono text-primary">
                          $
                          {Number(pos.currentValue).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-mono text-foreground/50">
                      No active positions
                    </p>
                  )}
                </div>
              </div>

              {/* Pending Rewards */}
              <div className="border border-border bg-background p-6">
                <p className="text-xs font-mono text-foreground/60 mb-2">
                  PENDING VAULT REWARDS
                </p>
                <p className="text-2xl font-sentient text-primary">
                  $
                  {summary
                    ? Number(summary.totalPendingRewards).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 }
                      )
                    : "0.00"}
                </p>
                <p className="text-xs font-mono text-foreground/50 mt-2">
                  Claim available
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity - Dynamic based on active tab */}
          <RecentActivityCard
            activityType={
              activeTab === "swap" ||
              activeTab === "invest" ||
              activeTab === "stake"
                ? activeTab
                : undefined
            }
            limit={5}
          />
        </div>
      </main>
    </div>
  );
}
