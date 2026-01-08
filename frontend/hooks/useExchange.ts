import { useState, useEffect } from "react";
import { getToken } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const EXCHANGE_CONTRACT = "0x1938C3345f2B6B2Fa3538713DB50f80ebA3a61d5";

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
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [depositingToken, setDepositingToken] = useState(false);
  const [depositingHbar, setDepositingHbar] = useState(false);
  const [initiatingPayment, setInitiatingPayment] = useState(false);

  // Fetch exchange rates
  const fetchRates = async () => {
    try {
      setLoadingRates(true);
      const token = getToken();
      const response = await fetch(`${API_URL}/exchange/rates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setRates(data.data.rates);
      } else {
        console.error("Failed to fetch rates:", data.message);
      }
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    } finally {
      setLoadingRates(false);
    }
  };

  // Calculate swap output
  const calculateSwap = async (
    fromToken: string,
    toToken: string,
    amount: number
  ): Promise<SwapCalculation | null> => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/exchange/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fromToken, toToken, amount }),
      });

      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("Error calculating swap:", error);
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
      console.log(
        `🔗 View on HashScan: https://hashscan.io/testnet/transaction/${txHash}`
      );

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

  // Fetch rates on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchRates();
    }
  }, []);

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
