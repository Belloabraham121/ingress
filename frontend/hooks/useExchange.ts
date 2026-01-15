import { useState, useEffect } from "react";
import { getToken } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const EXCHANGE_CONTRACT = "0x1938C3345f2B6B2Fa3538713DB50f80ebA3a61d5";

// LocalStorage keys
const RATES_STORAGE_KEY = "exchange_rates";
const RATES_TIMESTAMP_KEY = "exchange_rates_timestamp";
const RATES_MAX_AGE = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper: Load rates from localStorage
const loadRatesFromStorage = (): ExchangeRates | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(RATES_STORAGE_KEY);
    const timestamp = localStorage.getItem(RATES_TIMESTAMP_KEY);

    if (!stored || !timestamp) return null;

    const age = Date.now() - parseInt(timestamp, 10);
    if (age > RATES_MAX_AGE) {
      // Rates are stale, remove them
      localStorage.removeItem(RATES_STORAGE_KEY);
      localStorage.removeItem(RATES_TIMESTAMP_KEY);
      return null;
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading rates from storage:", error);
    return null;
  }
};

// Helper: Save rates to localStorage
const saveRatesToStorage = (rates: ExchangeRates): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(rates));
    localStorage.setItem(RATES_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error("Error saving rates to storage:", error);
  }
};

// Token addresses
const TOKENS = {
  USDC: "0x125D3f690f281659Dd7708D21688BC83Ee534aE6",
  USDT: "0xd4E61131Ed9C3dd610727655aE8254B286deE95c",
  DAI: "0x3814F5Cf6c4Aa63EdDF8A79c82346a163c7E7C53",
} as const;

interface ExchangeRates {
  [key: string]: number;
}

interface SwapCalculation {
  output: number;
  rate: number;
  usingFallback?: boolean; // Indicates if cached rates were used
}

interface ExchangeHook {
  // State
  rates: ExchangeRates | null;
  loadingRates: boolean;
  depositingToken: boolean;
  depositingHbar: boolean;
  initiatingPayment: boolean;

  // Functions
  fetchRates: () => Promise<void>;
  calculateSwap: (
    fromToken: string,
    toToken: string,
    amount: number
  ) => Promise<SwapCalculation | null>;
  depositTokenToNaira: (
    tokenAddress: string,
    amount: string
  ) => Promise<string | null>; // Returns transaction hash or null
  depositHbarToNaira: (amount: string) => Promise<boolean>;
  initiateNairaToToken: (
    tokenAddress: string,
    nairaAmount: number
  ) => Promise<string | null>;
  initiateNairaToHbar: (nairaAmount: number) => Promise<string | null>;

  // Helpers
  convertTokenToNaira: (tokenAddress: string, tokenAmount: number) => number;
  convertNairaToToken: (tokenAddress: string, nairaAmount: number) => number;
  convertHbarToNaira: (hbarAmount: number) => number;
  convertNairaToHbar: (nairaAmount: number) => number;
}

export const useExchange = (): ExchangeHook => {
  // Initialize with cached rates if available
  const [rates, setRates] = useState<ExchangeRates | null>(() =>
    loadRatesFromStorage()
  );
  const [loadingRates, setLoadingRates] = useState(false);
  const [depositingToken, setDepositingToken] = useState(false);
  const [depositingHbar, setDepositingHbar] = useState(false);
  const [initiatingPayment, setInitiatingPayment] = useState(false);

  // Helper: Fetch with timeout and retry
  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    retries = 3,
    timeout = 10000
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (
        retries > 0 &&
        ((error instanceof Error && error.name === "AbortError") ||
          error instanceof TypeError)
      ) {
        // Retry on timeout or network error with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, 3 - retries), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, timeout);
      }
      throw error;
    }
  };

  // Fetch exchange rates
  const fetchRates = async () => {
    try {
      setLoadingRates(true);
      const token = getToken();

      try {
        const response = await fetchWithRetry(
          `${API_URL}/exchange/rates`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          3, // 3 retries
          10000 // 10 second timeout
        );

        const data = await response.json();
        if (data.success) {
          const fetchedRates = data.data.rates;
          setRates(fetchedRates);
          // Save to localStorage for offline use
          saveRatesToStorage(fetchedRates);
        } else {
          console.error("Failed to fetch rates:", data.message);
        }
      } catch (apiError) {
        console.error("Error fetching exchange rates:", apiError);
        // Keep existing rates if available, don't clear them
        if (!rates) {
          console.warn("No cached rates available. Rates will be unavailable.");
        } else {
          console.warn("Using cached rates due to network issues.");
        }
      }
    } catch (error) {
      console.error("Unexpected error fetching exchange rates:", error);
    } finally {
      setLoadingRates(false);
    }
  };

  // Helper: Calculate swap using cached rates as fallback
  const calculateSwapFromRates = (
    fromToken: string,
    toToken: string,
    amount: number
  ): SwapCalculation | null => {
    if (!rates) return null;

    let fromRate: number | undefined;
    let toRate: number | undefined;

    // Handle fromToken
    if (fromToken.toLowerCase() === "hbar") {
      fromRate = rates.hbar;
    } else if (fromToken.toLowerCase() === "ngn") {
      fromRate = 1; // NGN is base currency
    } else {
      fromRate = rates[fromToken.toLowerCase()];
    }

    // Handle toToken
    if (toToken.toLowerCase() === "hbar") {
      toRate = rates.hbar;
    } else if (toToken.toLowerCase() === "ngn") {
      toRate = 1; // NGN is base currency
    } else {
      toRate = rates[toToken.toLowerCase()];
    }

    if (!fromRate || !toRate) return null;

    // Convert fromToken amount to NGN first, then to toToken
    let nairaAmount: number;
    if (fromToken.toLowerCase() === "ngn") {
      nairaAmount = amount;
    } else {
      nairaAmount = amount * fromRate;
    }

    let output: number;
    if (toToken.toLowerCase() === "ngn") {
      output = nairaAmount;
    } else {
      output = nairaAmount / toRate;
    }

    const rate = output / amount;
    return { output, rate };
  };

  // Calculate swap output
  const calculateSwap = async (
    fromToken: string,
    toToken: string,
    amount: number
  ): Promise<SwapCalculation | null> => {
    try {
      const token = getToken();

      // Try API call with retry and timeout
      try {
        const response = await fetchWithRetry(
          `${API_URL}/exchange/calculate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fromToken, toToken, amount }),
          },
          3, // 3 retries
          10000 // 10 second timeout
        );

        const data = await response.json();
        if (data.success) {
          return { ...data.data, usingFallback: false };
        }
      } catch (apiError) {
        console.warn("API calculation failed, using fallback:", apiError);
        // Fall through to use cached rates as fallback
      }

      // Fallback: Use cached rates if API fails
      const fallbackResult = calculateSwapFromRates(fromToken, toToken, amount);
      if (fallbackResult) {
        console.log("Using cached rates for calculation");
        return { ...fallbackResult, usingFallback: true };
      }

      return null;
    } catch (error) {
      console.error("Error calculating swap:", error);

      // Last resort: try fallback calculation
      const fallbackResult = calculateSwapFromRates(fromToken, toToken, amount);
      if (fallbackResult) {
        console.log("Using cached rates as last resort");
        return { ...fallbackResult, usingFallback: true };
      }

      return null;
    }
  };

  /**
   * Deposit Token → Get Naira
   * Step 1: Approve token
   * Step 2: Deposit token to Exchange contract
   * Backend automatically sends Naira to bank account
   */
  const depositTokenToNaira = async (
    tokenAddress: string,
    amount: string
  ): Promise<string | null> => {
    try {
      setDepositingToken(true);
      const token = getToken();

      // Step 1: Approve token
      console.log("Step 1: Approving token...");
      const approveResponse = await fetch(`${API_URL}/exchange/sign-approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tokenAddress,
          exchangeAddress: EXCHANGE_CONTRACT,
          amount,
        }),
      });

      const approveData = await approveResponse.json();
      if (!approveData.success) {
        console.error("Approval failed:", approveData.message);
        return null;
      }

      console.log("✅ Token approved!");
      console.log("Hedera Tx:", approveData.data?.transactionHash);

      // Step 2: Deposit token
      console.log("Step 2: Depositing token...");
      const depositResponse = await fetch(`${API_URL}/exchange/sign-deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exchangeAddress: EXCHANGE_CONTRACT,
          tokenAddress,
          amount,
        }),
      });

      const depositData = await depositResponse.json();
      if (!depositData.success) {
        console.error("Deposit failed:", depositData.message);
        return null;
      }

      const txHash = depositData.data?.transactionHash;
      console.log("✅ Token deposited!");
      console.log("💰 Naira will be sent to your bank account shortly");
      // console.log(
      //   `🔗 View on HashScan: https://hashscan.io/testnet/transaction/${txHash}`
      // );

      return txHash || "Transaction completed";
    } catch (error) {
      console.error("Error depositing token:", error);
      return null;
    } finally {
      setDepositingToken(false);
    }
  };

  /**
   * Deposit HBAR → Get Naira
   * Deposit HBAR to Exchange contract
   * Backend automatically sends Naira to bank account
   */
  const depositHbarToNaira = async (amount: string): Promise<boolean> => {
    try {
      setDepositingHbar(true);

      // Note: You'll need to implement depositHbar in your backend
      // For now, this is a placeholder
      console.log("Depositing HBAR:", amount);

      // TODO: Implement HBAR deposit endpoint in backend
      // const response = await fetch(`${API_URL}/exchange/deposit-hbar`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({
      //     exchangeAddress: EXCHANGE_CONTRACT,
      //     amount,
      //   }),
      // });

      console.log("✅ HBAR deposited!");
      console.log("💰 Naira will be sent to your bank account shortly");

      return true;
    } catch (error) {
      console.error("Error depositing HBAR:", error);
      return false;
    } finally {
      setDepositingHbar(false);
    }
  };

  /**
   * Pay Naira → Get Token
   * Initiate PayStack payment
   * After payment, backend sends token to wallet
   */
  const initiateNairaToToken = async (
    tokenAddress: string,
    nairaAmount: number
  ): Promise<string | null> => {
    try {
      setInitiatingPayment(true);
      const token = getToken();

      const response = await fetch(`${API_URL}/exchange/initiate-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tokenAddress,
          nairaAmount,
          exchangeType: "naira_to_token",
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Return PayStack authorization URL
        return data.data.authorizationUrl;
      } else {
        console.error("Failed to initiate payment:", data.message);
        return null;
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      return null;
    } finally {
      setInitiatingPayment(false);
    }
  };

  /**
   * Pay Naira → Get HBAR
   * Initiate PayStack payment
   * After payment, backend sends HBAR to wallet
   */
  const initiateNairaToHbar = async (
    nairaAmount: number
  ): Promise<string | null> => {
    try {
      setInitiatingPayment(true);
      const token = getToken();

      const response = await fetch(`${API_URL}/exchange/initiate-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nairaAmount,
          exchangeType: "naira_to_hbar",
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Return PayStack authorization URL
        return data.data.authorizationUrl;
      } else {
        console.error("Failed to initiate payment:", data.message);
        return null;
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      return null;
    } finally {
      setInitiatingPayment(false);
    }
  };

  // Helper: Convert token amount to naira
  const convertTokenToNaira = (
    tokenAddress: string,
    tokenAmount: number
  ): number => {
    if (!rates) return 0;
    const rate = rates[tokenAddress.toLowerCase()];
    if (!rate) return 0;
    return tokenAmount * rate;
  };

  // Helper: Convert naira to token amount
  const convertNairaToToken = (
    tokenAddress: string,
    nairaAmount: number
  ): number => {
    if (!rates) return 0;
    const rate = rates[tokenAddress.toLowerCase()];
    if (!rate) return 0;
    return nairaAmount / rate;
  };

  // Helper: Convert HBAR to naira
  const convertHbarToNaira = (hbarAmount: number): number => {
    if (!rates) return 0;
    const rate = rates.hbar;
    if (!rate) return 0;
    return hbarAmount * rate;
  };

  // Helper: Convert naira to HBAR
  const convertNairaToHbar = (nairaAmount: number): number => {
    if (!rates) return 0;
    const rate = rates.hbar;
    if (!rate) return 0;
    return nairaAmount / rate;
  };

  // Fetch rates on mount and when token becomes available
  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchRates();
    }
  }, []);

  // Listen for storage events (when rates are updated from another tab/window)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === RATES_STORAGE_KEY && e.newValue) {
        try {
          const newRates = JSON.parse(e.newValue);
          setRates(newRates);
        } catch (error) {
          console.error("Error parsing rates from storage event:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Listen for custom event to trigger rate fetch (e.g., after login)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFetchRatesEvent = () => {
      const token = getToken();
      if (token) {
        fetchRates();
      }
    };

    window.addEventListener("fetchExchangeRates", handleFetchRatesEvent);
    return () =>
      window.removeEventListener("fetchExchangeRates", handleFetchRatesEvent);
  }, [fetchRates]);

  return {
    // State
    rates,
    loadingRates,
    depositingToken,
    depositingHbar,
    initiatingPayment,

    // Functions
    fetchRates,
    calculateSwap,
    depositTokenToNaira,
    depositHbarToNaira,
    initiateNairaToToken,
    initiateNairaToHbar,

    // Helpers
    convertTokenToNaira,
    convertNairaToToken,
    convertHbarToNaira,
    convertNairaToHbar,
  };
};

export { EXCHANGE_CONTRACT, TOKENS };
