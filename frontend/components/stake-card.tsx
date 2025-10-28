"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StakeConfirmationModal } from "@/components/stake-confirmation-modal";
import { useStakingPools, POOL_IDS } from "@/hooks/useStakingPools";
import { useStakingDeposit } from "@/hooks/useStakingDeposit";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StakingPoolsABI from "@/lib/contracts/StakingPools.abi.json";

const STAKING_POOLS_ADDRESS = StakingPoolsABI.address;

interface StakingPool {
  id: number;
  token: string;
  tokenAddress: string;
  apy: number;
  totalStaked: string;
  yourStake: string;
}

export function StakeCard() {
  const [selectedPoolId, setSelectedPoolId] = useState<number>(POOL_IDS.USDC);
  const [stakeAmount, setStakeAmount] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Store confirmation details to prevent recalculation
  const [confirmationDetails, setConfirmationDetails] = useState({
    poolId: 0,
    amount: "",
    token: "",
    tokenAddress: "",
    dailyRewards: "0.0000",
  });

  const { stake, isStaking, error: stakingError } = useStakingDeposit();
  const { toast } = useToast();

  // Use the custom hook to fetch staking pools
  // TODO: Get user address from auth/wallet context
  const userAddress = undefined; // Replace with actual user address when available
  const { pools, userStakes, isLoading, error, refresh } =
    useStakingPools(userAddress);

  // Format pools for UI
  const stakingPools: StakingPool[] = useMemo(() => {
    return pools.map((pool) => {
      const tokenSymbol = pool.name.split(" ")[0]; // Extract token symbol from pool name
      const userStake = userStakes.get(pool.id);

      return {
        id: pool.id,
        token: tokenSymbol,
        tokenAddress: pool.token, // The ERC20 token address
        apy: pool.apyPercentage,
        totalStaked: `$${parseFloat(pool.totalStakedFormatted).toLocaleString(
          undefined,
          {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }
        )}`,
        yourStake: userStake
          ? `${parseFloat(userStake.amountFormatted).toFixed(2)} ${tokenSymbol}`
          : "$0",
      };
    });
  }, [pools, userStakes]);

  const selectedPool = stakingPools.find((p) => p.id === selectedPoolId);
  const dailyRewards = selectedPool
    ? (
        (Number.parseFloat(stakeAmount || "0") * (selectedPool.apy / 100)) /
        365
      ).toFixed(4)
    : "0.0000";

  const handleStakeClick = () => {
    if (stakeAmount && Number.parseFloat(stakeAmount) > 0 && selectedPool) {
      // Store current values before opening modal
      setConfirmationDetails({
        poolId: selectedPool.id,
        amount: stakeAmount,
        token: selectedPool.token,
        tokenAddress: selectedPool.tokenAddress,
        dailyRewards,
      });
      setShowConfirmation(true);
    }
  };

  const handleConfirmStake = async (): Promise<{
    success: boolean;
    txHash?: string;
  }> => {
    if (!confirmationDetails.amount || !confirmationDetails.tokenAddress) {
      return { success: false };
    }

    try {
      const result = await stake({
        stakingPoolAddress: STAKING_POOLS_ADDRESS,
        tokenAddress: confirmationDetails.tokenAddress,
        poolId: confirmationDetails.poolId,
        amount: confirmationDetails.amount,
      });

      if (result.success && result.txHash) {
        // Refresh pool data
        refresh();
        // Clear stake amount
        setStakeAmount("");
        return { success: true, txHash: result.txHash };
      } else {
        toast({
          title: "Stake Failed ❌",
          description: "Failed to stake tokens",
          variant: "destructive",
        });
        return { success: false };
      }
    } catch (err: any) {
      console.error("Stake error:", err);
      toast({
        title: "Stake Failed ❌",
        description: err.message || "Failed to stake tokens",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  // Loading state
  if (isLoading && pools.length === 0) {
    return (
      <div className="border border-border bg-background p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-mono text-foreground/60">
            Loading staking pools...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && pools.length === 0) {
    return (
      <div className="border border-border bg-background p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-mono text-destructive">{error}</p>
          <Button size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // No pools available
  if (pools.length === 0) {
    return (
      <div className="border border-border bg-background p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-sm font-mono text-foreground/60">
          No staking pools available
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-border bg-background p-6 space-y-6">
        {/* Staking Error State */}
        {stakingError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{stakingError}</AlertDescription>
          </Alert>
        )}

        <div>
          <label className="block text-sm font-mono text-foreground/60 mb-3">
            SELECT STAKING POOL
          </label>
          <div className="space-y-2">
            {stakingPools.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPoolId(p.id)}
                className={`w-full p-4 border text-left transition-colors ${
                  selectedPoolId === p.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono font-medium text-foreground">
                      {p.token} Pool
                    </p>
                    <p className="text-xs font-mono text-foreground/50 mt-1">
                      Total Staked: {p.totalStaked}
                    </p>
                  </div>
                  <p className="text-primary font-mono font-bold">
                    {p.apy}% APY
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-mono text-foreground/60 mb-3">
            STAKE AMOUNT ({selectedPool?.token})
          </label>
          <Input
            type="number"
            placeholder="0.00"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            className="bg-background border-border text-foreground placeholder:text-foreground/30"
          />
        </div>

        <div className="border border-border/50 p-4 space-y-2">
          <div className="flex justify-between text-sm font-mono">
            <span className="text-foreground/60">Daily Rewards:</span>
            <span className="text-primary">
              {dailyRewards} {selectedPool?.token}
            </span>
          </div>
          <div className="flex justify-between text-sm font-mono">
            <span className="text-foreground/60">Unstake Cooldown:</span>
            <span className="text-foreground">Instant</span>
          </div>
          <div className="flex justify-between text-sm font-mono">
            <span className="text-foreground/60">Your Current Stake:</span>
            <span className="text-foreground">{selectedPool?.yourStake}</span>
          </div>
        </div>

        <Button
          onClick={handleStakeClick}
          disabled={
            !stakeAmount ||
            Number.parseFloat(stakeAmount) <= 0 ||
            isLoading ||
            isStaking
          }
          className="w-full"
        >
          {isStaking
            ? "PROCESSING..."
            : isLoading
            ? "LOADING..."
            : "[STAKE NOW]"}
        </Button>
      </div>

      <StakeConfirmationModal
        isOpen={showConfirmation}
        onClose={() => !isStaking && setShowConfirmation(false)}
        onConfirm={handleConfirmStake}
        token={confirmationDetails.token}
        amount={confirmationDetails.amount}
        apy={selectedPool?.apy || 0}
        dailyRewards={`${confirmationDetails.dailyRewards} ${confirmationDetails.token}`}
        unstakeCooldown="Instant"
      />
    </>
  );
}
