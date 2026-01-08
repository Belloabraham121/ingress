/**
 * Hedera utility functions
 */

import { ethers } from "ethers";
import ERC20_ABI from "./contracts/ERC20.abi.json";

interface HederaAccountData {
  evm_address: string;
  account: string;
  balance: {
    balance: number;
  };
}

// Supported token addresses on Hedera testnet
export const SUPPORTED_TOKENS = {
  DAI: {
    address: "0x3814F5Cf6c4Aa63EdDF8A79c82346a163c7E7C53",
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
  },
  USDC: {
    address: "0x125D3f690f281659Dd7708D21688BC83Ee534aE6",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 18,
  },
  USDT: {
    address: "0xd4E61131Ed9C3dd610727655aE8254B286deE95c",
    symbol: "USDT",
    name: "Tether",
    decimals: 18,
  },
} as const;

/**
 * Get EVM address from Hedera account ID via mirror node
 * @param accountId - Hedera account ID (e.g., "0.0.12345")
 * @returns EVM address (0x...)
 */
export async function getEvmAddressFromAccountId(
  accountId: string
): Promise<string> {
  try {
    const response = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch account data: ${response.statusText}`);
    }

    const data: HederaAccountData = await response.json();

    if (!data.evm_address) {
      throw new Error("No EVM address found for this account");
    }

    // Ensure the address has 0x prefix
    const evmAddress = data.evm_address.startsWith("0x")
      ? data.evm_address
      : `0x${data.evm_address}`;

    return evmAddress;
  } catch (error: any) {
    console.error("Error fetching EVM address:", error);
    throw new Error(
      error.message || "Failed to fetch EVM address from Hedera mirror node"
    );
  }
}

/**
 * Validate Hedera account ID format
 */
export function isValidAccountId(accountId: string): boolean {
  const accountIdRegex = /^\d+\.\d+\.\d+$/;
  return accountIdRegex.test(accountId);
}

/**
 * Get token balance for a specific ERC20 token
 * @param tokenAddress - ERC20 token contract address
 * @param userEvmAddress - User's EVM address
 * @param decimals - Token decimals
 * @returns Token balance as a number
 */
export async function getTokenBalance(
  tokenAddress: string,
  userEvmAddress: string,
  decimals: number
): Promise<number> {
  try {
    // Use Hedera JSON-RPC relay
    const provider = new ethers.JsonRpcProvider(
      "https://testnet.hashio.io/api"
    );

    // Create contract instance
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    );

    // Get balance
    const balance = await tokenContract.balanceOf(userEvmAddress);

    // Convert from wei to token amount
    const formattedBalance = parseFloat(ethers.formatUnits(balance, decimals));

    return formattedBalance;
  } catch (error: any) {
    console.error(`Error fetching token balance for ${tokenAddress}:`, error);
    // Return 0 instead of throwing to prevent UI breakage
    return 0;
  }
}

/**
 * Get all supported token balances for a user
 * @param accountId - Hedera account ID
 * @returns Array of token balances with metadata
 */
export async function getAllTokenBalances(accountId: string): Promise<
  Array<{
    name: string;
    symbol: string;
    amount: number;
    value: number;
    address: string;
  }>
> {
  try {
    // Get user's EVM address from account ID
    const evmAddress = await getEvmAddressFromAccountId(accountId);

    // Fetch all token balances in parallel
    const balancePromises = Object.values(SUPPORTED_TOKENS).map(
      async (token) => {
        const amount = await getTokenBalance(
          token.address,
          evmAddress,
          token.decimals
        );

        // For stablecoins, value = amount (1:1 with USD)
        const value = amount;

        return {
          name: token.name,
          symbol: token.symbol,
          amount,
          value,
          address: token.address,
        };
      }
    );

    const balances = await Promise.all(balancePromises);

    return balances;
  } catch (error: any) {
    console.error("Error fetching all token balances:", error);
    // Return empty array with all tokens showing 0 balance
    return Object.values(SUPPORTED_TOKENS).map((token) => ({
      name: token.name,
      symbol: token.symbol,
      amount: 0,
      value: 0,
      address: token.address,
    }));
  }
}
