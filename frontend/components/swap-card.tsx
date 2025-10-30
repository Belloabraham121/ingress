"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDownUp, ChevronDown } from "lucide-react";
import { SwapConfirmationModal } from "@/components/swap-confirmation-modal";
import { useExchange, TOKENS } from "@/hooks/useExchange";
import { getToken } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TokenOption = {
  symbol: string;
  name: string;
  address?: string;
  logo?: string;
};

const AVAILABLE_TOKENS: TokenOption[] = [
  { symbol: "NGN", name: "Nigerian Naira" },
  { symbol: "USDC", name: "USD Coin", address: TOKENS.USDC },
  { symbol: "USDT", name: "Tether USD", address: TOKENS.USDT },
  { symbol: "DAI", name: "Dai Stablecoin", address: TOKENS.DAI },
  { symbol: "HBAR", name: "Hedera" },
];

// Helper to get token decimals
const getTokenDecimals = (symbol: string): number => {
  if (symbol === "HBAR") return 8; // display purposes; on-chain is 8
  return 18; // All stables and others use 18 in our utils/contracts
};

// Display precision (UI) independent of on-chain decimals
const getDisplayDecimals = (symbol: string): number => {
  if (symbol === "USDC" || symbol === "USDT" || symbol === "DAI") return 1; // e.g., 6.9
  if (symbol === "HBAR") return 4;
  return 4;
};

// Helper to trim trailing zeros from a decimal string
const trimTrailingZeros = (val: string): string => {
  return val.replace(/\.0+$|(?<=\.[0-9]*?)0+$/g, "").replace(/\.$/, "");
};

export function SwapCard() {
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fromToken, setFromToken] = useState<TokenOption>(AVAILABLE_TOKENS[0]); // NGN
  const [toToken, setToToken] = useState<TokenOption>(AVAILABLE_TOKENS[1]); // USDC
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const {
    rates,
    loadingRates,
    calculateSwap,
    depositTokenToNaira,
    initiateNairaToToken,
    initiateNairaToHbar,
    depositingToken,
    initiatingPayment,
  } = useExchange();
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  // Calculate conversion when amount or tokens change
  useEffect(() => {
    if (fromAmount && fromToken && toToken && rates) {
      calculateConversion();
    } else {
      setToAmount("");
    }
  }, [fromAmount, fromToken, toToken, rates]);

  const calculateConversion = async () => {
    if (!fromAmount || !fromToken || !toToken) return;

    setIsCalculating(true);
    try {
      const fromAddress = fromToken.address || fromToken.symbol;
      const toAddress = toToken.address || toToken.symbol;

      const result = await calculateSwap(
        fromAddress,
        toAddress,
        parseFloat(fromAmount)
      );
      if (result) {
        const displayDec = getDisplayDecimals(toToken.symbol);
        const formatted = trimTrailingZeros(result.output.toFixed(displayDec));
        setToAmount(formatted);
      }
    } catch (error) {
      console.error("Error calculating swap:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSwapTokens = () => {
    // Swap the tokens
    const tempToken = fromToken;
    const tempAmount = fromAmount;

    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const getExchangeRate = () => {
    if (!fromAmount || !toAmount || parseFloat(fromAmount) === 0) return "0";
    const rate = parseFloat(toAmount) / parseFloat(fromAmount);
    return `1 ${fromToken.symbol} = ${rate.toFixed(6)} ${toToken.symbol}`;
  };

  const handleConfirmSwap = async (): Promise<{
    success: boolean;
    transactionHash?: string;
  }> => {
    try {
      const amount = parseFloat(fromAmount);

      // Case 1: Token → Naira (Cash out)
      if (toToken.symbol === "NGN" && fromToken.address) {
        // Calculate token amount with decimals
        const decimals = getTokenDecimals(fromToken.symbol);
        const amountInSmallestUnit = (
          amount * Math.pow(10, decimals)
        ).toString();

        const result = await depositTokenToNaira(
          fromToken.address,
          amountInSmallestUnit
        );
        if (result) {
          // Immediately trigger backend cashout to Paystack
          const token = getToken();
          const API_URL =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
          try {
            const resp = await fetch(`${API_URL}/exchange/cashout-token`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                tokenAddress: fromToken.address,
                amountSmallest: amountInSmallestUnit,
                tokenDecimals: decimals,
              }),
            });
            const data = await resp.json();
            if (!data.success) {
              alert(data.message || "❌ Cashout failed on server.");
              return { success: false };
            }
          } catch (e) {
            console.error("Cashout error:", e);
            alert("❌ Cashout error. Please try again later.");
            return { success: false };
          }

          resetForm();
          return {
            success: true,
            transactionHash: "Cashout initiated - funds will arrive shortly",
          };
        } else {
          alert("❌ Swap failed. Please try again.");
          return { success: false };
        }
      }
      // Case 2: Naira → Token (Buy crypto using existing NGN balance)
      else if (fromToken.symbol === "NGN" && toToken.address) {
        const token = getToken();
        const resp = await fetch(`${API_URL}/exchange/spend-naira`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            exchangeType: "naira_to_token",
            nairaAmount: amount,
            tokenAddress: toToken.address,
          }),
        });
        const data = await resp.json();
        if (!data.success) {
          alert(data.message || "❌ Swap failed.");
          return { success: false };
        }
        resetForm();
        return {
          success: true,
          transactionHash: data.data?.transactionHash,
        };
      }
      // Case 3: Naira → HBAR (using existing NGN balance)
      else if (fromToken.symbol === "NGN" && toToken.symbol === "HBAR") {
        const token = getToken();
        const resp = await fetch(`${API_URL}/exchange/spend-naira`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            exchangeType: "naira_to_hbar",
            nairaAmount: amount,
          }),
        });
        const data = await resp.json();
        if (!data.success) {
          alert(data.message || "❌ Swap failed.");
          return { success: false };
        }
        resetForm();
        return {
          success: true,
          transactionHash: data.data?.transactionHash,
        };
      }
      // Case 4: HBAR → Token (Direct via Exchange)
      else if (fromToken.symbol === "HBAR" && toToken.address) {
        const token = getToken();
        const resp = await fetch(`${API_URL}/exchange/swap-hbar-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            toTokenAddress: toToken.address,
            hbarAmount: amount,
          }),
        });
        const data = await resp.json();
        if (!data.success) {
          alert(data.message || "❌ Swap failed on server.");
          return { success: false };
        }

        resetForm();
        return {
          success: true,
          transactionHash: data.data?.transactionHash || "Swap executed",
        };
      }
      // Case 5: Token → Token (Direct via Exchange, no Paystack)
      else if (fromToken.address && toToken.address) {
        // Step 1: Deposit source token to Exchange
        const fromDecimals = getTokenDecimals(fromToken.symbol);
        const toDecimals = getTokenDecimals(toToken.symbol);

        const amountInSmallestUnit = (
          amount * Math.pow(10, fromDecimals)
        ).toString();

        const depositTxHash = await depositTokenToNaira(
          fromToken.address,
          amountInSmallestUnit
        );

        if (!depositTxHash) {
          alert("❌ Deposit failed. Please try again.");
          return { success: false };
        }

        // Step 2: Ask backend to send target token to user directly
        const token = getToken();
        const resp = await fetch(`${API_URL}/exchange/swap-token-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fromTokenAddress: fromToken.address,
            toTokenAddress: toToken.address,
            fromAmountSmallest: amountInSmallestUnit,
            fromTokenDecimals: fromDecimals,
            toTokenDecimals: toDecimals,
          }),
        });

        const data = await resp.json();
        if (!data.success) {
          alert(data.message || "❌ Swap failed on server.");
          return { success: false };
        }

        resetForm();
        return {
          success: true,
          transactionHash: data.data?.transactionHash || "Swap executed",
        };
      }
      // Case 6: HBAR → Naira (cashout via Paystack)
      else if (fromToken.symbol === "HBAR" && toToken.symbol === "NGN") {
        const token = getToken();
        const resp = await fetch(`${API_URL}/exchange/cashout-hbar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ hbarAmount: amount }),
        });
        const data = await resp.json();
        if (!data.success) {
          alert(data.message || "❌ Cashout failed on server.");
          return { success: false };
        }

        resetForm();
        return {
          success: true,
          transactionHash: data.data?.transferCode || "Cashout initiated",
        };
      }

      // Case 7: Token → HBAR (not yet supported)
      else {
        alert(
          "⚠️ This swap combination is not yet supported. Supported swaps:\n\n" +
            "✅ Token ↔ NGN\n" +
            "✅ HBAR ↔ NGN\n" +
            "✅ Token ↔ Token (via NGN)\n"
        );
        return { success: false };
      }
    } catch (error) {
      console.error("Error during swap:", error);
      alert("❌ An error occurred. Please try again.");
      return { success: false };
    }
  };

  const resetForm = () => {
    setFromAmount("");
    setToAmount("");
  };

  const isSwapDisabled =
    !fromAmount ||
    !toAmount ||
    parseFloat(fromAmount) <= 0 ||
    loadingRates ||
    isCalculating;
  const isProcessing = depositingToken || initiatingPayment;

  return (
    <>
      <div className="border border-border bg-background p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-sentient">Swap Assets</h3>
          {loadingRates && (
            <span className="text-xs font-mono text-foreground/60">
              Loading rates...
            </span>
          )}
        </div>

        {/* From Section */}
        <div>
          <label className="block text-sm font-mono text-foreground/60 mb-3">
            FROM
          </label>
          <div className="space-y-3">
            {/* Token Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full px-4 py-3 border border-border bg-background hover:border-primary/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-mono text-xs font-bold">
                        {fromToken.symbol.substring(0, 2)}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="font-mono text-sm font-medium">
                        {fromToken.symbol}
                      </div>
                      <div className="text-xs text-foreground/50">
                        {fromToken.name}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-foreground/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                {AVAILABLE_TOKENS.filter(
                  (t) => t.symbol !== toToken.symbol
                ).map((token) => (
                  <DropdownMenuItem
                    key={token.symbol}
                    onClick={() => setFromToken(token)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-mono text-xs font-bold">
                          {token.symbol.substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-mono text-sm font-medium">
                          {token.symbol}
                        </div>
                        <div className="text-xs text-foreground/50">
                          {token.name}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Amount Input */}
            <Input
              type="number"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="text-2xl h-14 bg-background border-border text-foreground placeholder:text-foreground/30 font-mono"
              step="any"
              min="0"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapTokens}
            className="p-3 border border-border hover:border-primary transition-colors hover:bg-primary/5 active:scale-95 transform"
            disabled={isProcessing}
          >
            <ArrowDownUp className="w-5 h-5 text-primary" />
          </button>
        </div>

        {/* To Section */}
        <div>
          <label className="block text-sm font-mono text-foreground/60 mb-3">
            TO
          </label>
          <div className="space-y-3">
            {/* Token Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full px-4 py-3 border border-border bg-background hover:border-primary/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-mono text-xs font-bold">
                        {toToken.symbol.substring(0, 2)}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="font-mono text-sm font-medium">
                        {toToken.symbol}
                      </div>
                      <div className="text-xs text-foreground/50">
                        {toToken.name}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-foreground/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                {AVAILABLE_TOKENS.filter(
                  (t) => t.symbol !== fromToken.symbol
                ).map((token) => (
                  <DropdownMenuItem
                    key={token.symbol}
                    onClick={() => setToToken(token)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-mono text-xs font-bold">
                          {token.symbol.substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-mono text-sm font-medium">
                          {token.symbol}
                        </div>
                        <div className="text-xs text-foreground/50">
                          {token.name}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Amount Display */}
            <div className="relative">
              <Input
                type="text"
                placeholder="0.00"
                value={toAmount}
                readOnly
                className="text-2xl h-14 bg-background border-border text-foreground placeholder:text-foreground/30 font-mono"
              />
              {isCalculating && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exchange Rate Display */}
        {fromAmount && toAmount && (
          <div className="px-4 py-3 bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between text-sm font-mono">
              <span className="text-foreground/60">Exchange Rate</span>
              <span className="text-primary font-medium">
                {getExchangeRate()}
              </span>
            </div>
          </div>
        )}

        {/* Current Rates Info */}
        {rates && !loadingRates && (
          <div className="text-xs font-mono text-foreground/50 space-y-1">
            <div>Current rates (live):</div>
            <div className="pl-2">
              1 USDC = ₦{rates[TOKENS.USDC.toLowerCase()]?.toFixed(2)}
            </div>
            <div className="pl-2">
              1 USDT = ₦{rates[TOKENS.USDT.toLowerCase()]?.toFixed(2)}
            </div>
            <div className="pl-2">1 HBAR = ₦{rates.hbar?.toFixed(2)}</div>
          </div>
        )}

        {/* Swap Button */}
        <Button
          onClick={() => setIsModalOpen(true)}
          disabled={isSwapDisabled || isProcessing}
          className="w-full h-12 text-base"
        >
          {isProcessing ? "[PROCESSING...]" : "[SWAP]"}
        </Button>
      </div>

      {/* Confirmation Modal */}
      <SwapConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSwap}
        fromAmount={fromAmount}
        fromCurrency={fromToken.symbol}
        toAmount={toAmount}
        toCurrency={toToken.symbol}
        exchangeRate={getExchangeRate()}
      />
    </>
  );
}
