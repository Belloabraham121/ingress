import axios from "axios";

const HEDERA_MIRROR_NODE = "https://testnet.mirrornode.hedera.com/api/v1";

/**
 * Get EVM address from Hedera account ID using mirror node
 * This returns the actual on-chain EVM address for the account
 */
export async function getEvmAddressFromAccountId(
  accountId: string
): Promise<string> {
  try {
    const response = await axios.get(
      `${HEDERA_MIRROR_NODE}/accounts/${accountId}`
    );

    const evmAddress = response.data.evm_address;

    if (!evmAddress) {
      throw new Error(`No EVM address found for account ${accountId}`);
    }

    return evmAddress;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`Account ${accountId} not found on Hedera testnet`);
    }
    console.error("Error fetching EVM address from mirror node:", error);
    throw new Error(
      `Failed to fetch EVM address for account ${accountId}: ${error.message}`
    );
  }
}
