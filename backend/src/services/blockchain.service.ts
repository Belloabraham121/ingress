import {
  Client,
  PrivateKey,
  AccountId,
  AccountCreateTransaction,
  Hbar,
  AccountBalanceQuery,
  TransferTransaction,
} from "@hashgraph/sdk";
import { env } from "../config/env";

export class BlockchainService {
  private client: Client;
  private operatorId: AccountId;
  private operatorKey: PrivateKey;

  constructor() {
    if (!env.HEDERA_OPERATOR_ID || !env.HEDERA_OPERATOR_KEY) {
      throw new Error(
        "HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set in environment variables"
      );
    }

    this.operatorId = AccountId.fromString(env.HEDERA_OPERATOR_ID);
    this.operatorKey = PrivateKey.fromStringECDSA(env.HEDERA_OPERATOR_KEY);
    this.client = Client.forTestnet().setOperator(
      this.operatorId,
      this.operatorKey
    );

    console.log(
      `✅ Hedera blockchain service initialized with operator: ${this.operatorId}`
    );
  }

  /**
   * Create new Hedera account from ECDSA private key
   */
  async createAccount(privateKey: string): Promise<{
    accountId: string;
    evmAddress: string;
  }> {
    try {
      const newAccountPrivateKey = PrivateKey.fromStringECDSA(privateKey);
      const newAccountPublicKey = newAccountPrivateKey.publicKey;

      const transaction = new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(0));

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      const newAccountId = receipt.accountId;

      if (!newAccountId) {
        throw new Error("Failed to create account - no account ID returned");
      }

      // Get EVM address from public key
      const evmAddress = `0x${newAccountPublicKey.toEvmAddress()}`;

      console.log(`✅ Created new Hedera account: ${newAccountId.toString()}`);
      console.log(`   EVM Address: ${evmAddress}`);

      return {
        accountId: newAccountId.toString(),
        evmAddress: evmAddress,
      };
    } catch (error) {
      console.error("Error creating Hedera account:", error);
      throw new Error(
        `Failed to create Hedera account: ${(error as Error).message}`
      );
    }
  }

  /**
   * Fund wallet with activation amount
   */
  async fundWallet(
    accountId: string,
    amount: string = env.ACTIVATION_AMOUNT
  ): Promise<{
    success: boolean;
    txId?: string;
    message: string;
  }> {
    try {
      const amountHbar = Hbar.fromString(amount);

      const transaction = new TransferTransaction()
        .addHbarTransfer(this.operatorId, amountHbar.negated())
        .addHbarTransfer(AccountId.fromString(accountId), amountHbar);

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      if (receipt.status.toString() === "SUCCESS") {
        console.log(
          `✅ Funded account ${accountId} with ${amount} HBAR: ${txResponse.transactionId}`
        );
        return {
          success: true,
          txId: txResponse.transactionId.toString(),
          message: `Successfully funded wallet with ${amount} HBAR`,
        };
      } else {
        return {
          success: false,
          message: "Transaction failed during execution",
        };
      }
    } catch (error) {
      console.error("Error funding wallet:", error);
      return {
        success: false,
        message: `Failed to fund wallet: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get HBAR balance for an account
   */
  async getHBARBalance(accountId: string): Promise<string> {
    try {
      const balanceQuery = new AccountBalanceQuery().setAccountId(
        AccountId.fromString(accountId)
      );
      const balance = await balanceQuery.execute(this.client);
      return balance.hbars.toString();
    } catch (error) {
      console.error(`Error getting HBAR balance for ${accountId}:`, error);
      throw new Error("Failed to get HBAR balance");
    }
  }

  /**
   * Validate Hedera account ID format
   */
  isValidAccountId(accountId: string): boolean {
    try {
      AccountId.fromString(accountId);
      return true;
    } catch {
      return false;
    }
  }
}

export const blockchainService = new BlockchainService();
