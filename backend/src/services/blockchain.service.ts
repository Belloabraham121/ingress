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
   * Transfer HBAR between accounts (user to user)
   */
  async transferHBAR(
    fromAccountId: string,
    fromPrivateKey: string,
    toAccountId: string,
    amount: string
  ): Promise<{
    success: boolean;
    txId?: string;
    message: string;
    balance?: string;
  }> {
    try {
      // Validate inputs
      if (!this.isValidAccountId(fromAccountId)) {
        return {
          success: false,
          message: "Invalid sender account ID",
        };
      }

      if (!this.isValidAccountId(toAccountId)) {
        return {
          success: false,
          message: "Invalid recipient account ID",
        };
      }

      const amountHbar = Hbar.fromString(amount);

      // Validate amount is positive
      if (amountHbar.toTinybars().toNumber() <= 0) {
        return {
          success: false,
          message: "Amount must be greater than 0",
        };
      }

      // Create client with sender's credentials
      const senderKey = PrivateKey.fromStringECDSA(fromPrivateKey);
      const senderClient = Client.forTestnet().setOperator(
        AccountId.fromString(fromAccountId),
        senderKey
      );

      // Check sender's balance first
      const senderBalance = await new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(fromAccountId))
        .execute(senderClient);

      if (
        senderBalance.hbars.toTinybars().toNumber() <
        amountHbar.toTinybars().toNumber()
      ) {
        return {
          success: false,
          message: "Insufficient balance",
          balance: senderBalance.hbars.toString(),
        };
      }

      // Create and execute transfer transaction
      const transaction = new TransferTransaction()
        .addHbarTransfer(
          AccountId.fromString(fromAccountId),
          amountHbar.negated()
        )
        .addHbarTransfer(AccountId.fromString(toAccountId), amountHbar);

      const txResponse = await transaction.execute(senderClient);
      const receipt = await txResponse.getReceipt(senderClient);

      // Get updated balance
      const newBalance = await new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(fromAccountId))
        .execute(senderClient);

      if (receipt.status.toString() === "SUCCESS") {
        console.log(
          `✅ Transferred ${amount} HBAR from ${fromAccountId} to ${toAccountId}: ${txResponse.transactionId}`
        );
        return {
          success: true,
          txId: txResponse.transactionId.toString(),
          message: `Successfully transferred ${amount} HBAR`,
          balance: newBalance.hbars.toString(),
        };
      } else {
        return {
          success: false,
          message: "Transaction failed during execution",
        };
      }
    } catch (error) {
      console.error("Error transferring HBAR:", error);
      return {
        success: false,
        message: `Failed to transfer HBAR: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Send HBAR from operator to any account (for testing/funding)
   */
  async sendHBAR(
    toAccountId: string,
    amount: string
  ): Promise<{
    success: boolean;
    txId?: string;
    message: string;
  }> {
    try {
      if (!this.isValidAccountId(toAccountId)) {
        return {
          success: false,
          message: "Invalid recipient account ID",
        };
      }

      const amountHbar = Hbar.fromString(amount);

      if (amountHbar.toTinybars().toNumber() <= 0) {
        return {
          success: false,
          message: "Amount must be greater than 0",
        };
      }

      const transaction = new TransferTransaction()
        .addHbarTransfer(this.operatorId, amountHbar.negated())
        .addHbarTransfer(AccountId.fromString(toAccountId), amountHbar);

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      if (receipt.status.toString() === "SUCCESS") {
        console.log(
          `✅ Sent ${amount} HBAR to ${toAccountId}: ${txResponse.transactionId}`
        );
        return {
          success: true,
          txId: txResponse.transactionId.toString(),
          message: `Successfully sent ${amount} HBAR`,
        };
      } else {
        return {
          success: false,
          message: "Transaction failed during execution",
        };
      }
    } catch (error) {
      console.error("Error sending HBAR:", error);
      return {
        success: false,
        message: `Failed to send HBAR: ${(error as Error).message}`,
      };
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
