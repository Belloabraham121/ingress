```
import { ethers } from "ethers";
import * as bip39 from "bip39";
import * as crypto from "crypto";

export class HederaWalletGenerator {
  private env: {
    MASTER_SEED: string;
    ENCRYPTION_SECRET_KEY: string;
  };

  constructor(env: { MASTER_SEED: string; ENCRYPTION_SECRET_KEY: string }) {
    this.env = env;
  }

  generateDeterministicWallet(phoneNumber: string): ethers.HDNodeWallet {
    try {
      if (!bip39.validateMnemonic(this.env.MASTER_SEED)) {
        throw new Error("Invalid master seed mnemonic");
      }

      const seed = bip39.mnemonicToSeedSync(this.env.MASTER_SEED);
      const masterNode = ethers.HDNodeWallet.fromSeed(seed);

      const phoneHash = ethers.keccak256(ethers.toUtf8Bytes(phoneNumber));
      const index = BigInt(phoneHash) % BigInt(2147483647);

      const derivationPath = `m/44'/60'/0'/0/${index.toString()}`;
      const wallet = masterNode.derivePath(derivationPath);

      console.log(
        `Generated wallet for ${phoneNumber} at path: ${derivationPath}`
      );
      return wallet;
    } catch (error) {
      console.error("Error generating deterministic wallet:", error);
      throw new Error("Failed to generate wallet");
    }
  }

  encryptPrivateKey(privateKey: string): {
    encryptedData: string;
    iv: string;
    authTag: string;
  } {
    try {
      const algorithm = "aes-256-gcm";
      const secretKey = Buffer.from(
        this.env.ENCRYPTION_SECRET_KEY.replace("0x", ""),
        "hex"
      );

      if (secretKey.length !== 32) {
        throw new Error(
          "Encryption secret key must be 32 bytes (64 hex characters)"
        );
      }

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
      cipher.setAAD(Buffer.from("wallet-encryption", "utf8"));

      let encrypted = cipher.update(privateKey, "utf8", "hex");
      encrypted += cipher.final("hex");
      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
      };
    } catch (error) {
      console.error("Error encrypting private key:", error);
      throw new Error("Failed to encrypt private key");
    }
  }

  decryptPrivateKey(
    encryptedData: string,
    iv: string,
    authTag: string
  ): string {
    try {
      const algorithm = "aes-256-gcm";
      const secretKey = Buffer.from(
        this.env.ENCRYPTION_SECRET_KEY.replace("0x", ""),
        "hex"
      );
      const ivBuffer = Buffer.from(iv, "hex");

      const decipher = crypto.createDecipheriv(algorithm, secretKey, ivBuffer);
      decipher.setAAD(Buffer.from("wallet-encryption", "utf8"));
      decipher.setAuthTag(Buffer.from(authTag, "hex"));

      let decrypted = decipher.update(encryptedData, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Error decrypting private key:", error);
      throw new Error("Failed to decrypt private key");
    }
  }
}
```

```
import mongoose, { Schema, Document } from "mongoose";

export interface IWallet extends Document {
  phoneNumber: string;
  accountId: string;
  encryptedPrivateKey: string;
  iv: string;
  authTag: string;
  trackedWallets?: string[];
  copyTrade?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema: Schema = new Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    accountId: {
      type: String,
      required: true,
      unique: true,
    },
    encryptedPrivateKey: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    authTag: {
      type: String,
      required: true,
    },
    trackedWallets: { type: [String], default: [] },
    copyTrade: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);
```

```
import {
  Client,
  PrivateKey,
  AccountId,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  TokenAssociateTransaction,
  TokenId,
  Hbar,
  ContractCallQuery,
  AccountBalanceQuery,
  TransferTransaction,
  TransactionReceiptQuery,
  TransactionId,
} from "@hashgraph/sdk";
import { env } from "../config/env";

type Transaction = {
  txId: string;
  sender: string;
  recipient: string;
  amount: number;
  token: string;
  status: "pending" | "completed" | "failed";
  timestamp: number;
};

export class HederaBlockchainModel {
  private client: Client;
  private operatorId: AccountId;
  private operatorKey: PrivateKey;

  constructor() {
    if (!env.HEDERA_OPERATOR_ID || !env.HEDERA_OPERATOR_KEY) {
      throw new Error(
        "Environment variables HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set"
      );
    }

    this.operatorId = AccountId.fromString(env.HEDERA_OPERATOR_ID);
    this.operatorKey = PrivateKey.fromStringECDSA(env.HEDERA_OPERATOR_KEY);
    this.client = Client.forTestnet().setOperator(
      this.operatorId,
      this.operatorKey
    );

    console.log(
      `✅ Hedera blockchain model initialized with operator: ${this.operatorId}`
    );
  }

  async associateTokens(
    accountId: string,
    tokenId: string,
    privateKey: string
  ): Promise<void> {
    if (tokenId === "HBAR") return;
    try {
      const tx = new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(accountId))
        .setTokenIds([TokenId.fromString(tokenId)])
        .freezeWith(this.client);
      const signedTx = await tx.sign(PrivateKey.fromStringECDSA(privateKey));
      const txResponse = await signedTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      if (receipt.status.toString() !== "SUCCESS") {
        throw new Error(`Token association failed: ${receipt.status}`);
      }
      console.log(`Associated token ${tokenId} with account ${accountId}`);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT")
      ) {
        console.log(`Token ${tokenId} already associated with ${accountId}`);
      } else {
        throw new Error(
          `Failed to associate token ${tokenId}: ${(error as Error).message}`
        );
      }
    }
  }

  async getTokenBalance(accountId: string, tokenId: string): Promise<number> {
    const response = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/balances?account.id=${accountId}`
    );
    const data = await response.json();
    const tokenBalance = data.balances[0]?.tokens?.find(
      (t: any) => t.token_id === tokenId
    );
    return tokenBalance?.balance || 0;
  }

  async callContractFunction(
    contractId: string,
    functionName: string,
    parameters: any[],
    privateKey: string,
    payerAccountId: string
  ) {
    const params = new ContractFunctionParameters();
    parameters.forEach((param) => {
      if (typeof param === "string" && param.startsWith("0.0.")) {
        params.addAddress(param); // For Hedera account IDs or token IDs
      } else if (Array.isArray(param)) {
        param.forEach((p) => params.addAddress(p)); // For address arrays (e.g., path)
      } else if (typeof param === "number" || typeof param === "string") {
        params.addUint256(Number(param)); // For amounts and deadlines
      }
    });

    const tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1000000)
      .setFunction(functionName, params);
    const signedTx = await tx.sign(PrivateKey.fromStringECDSA(privateKey));
    const txResponse = await signedTx.execute(this.client);
    const receipt = await txResponse.getReceipt(this.client);
    if (receipt.status.toString() !== "SUCCESS") {
      throw new Error(`Contract call failed: ${receipt.status}`);
    }
    return receipt;
  }

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

  async transferHBAR(
    fromPrivateKey: string,
    fromAccountId: string,
    toAccountId: string,
    amount: string,
    senderPhone: string,
    recipientPhone?: string
  ): Promise<{
    success: boolean;
    txId?: string;
    message: string;
    transaction?: Transaction;
  }> {
    try {
      const fromKey = PrivateKey.fromStringECDSA(fromPrivateKey);
      const amountHbar = Hbar.fromString(amount);

      const senderBalance = await this.getHBARBalance(fromAccountId);
      if (Number(senderBalance) < Number(amount)) {
        return {
          success: false,
          message: `Insufficient HBAR balance. You have ${senderBalance} HBAR, but tried to send ${amount} HBAR.`,
        };
      }

      const txId = TransactionId.generate(
        AccountId.fromString(fromAccountId)
      ).toString();

      const transaction: Transaction = {
        txId,
        sender: senderPhone,
        recipient: recipientPhone || toAccountId,
        amount: parseFloat(amount),
        token: "HBAR",
        status: "pending",
        timestamp: Math.floor(Date.now() / 1000),
      };

      const clientWithSender = Client.forTestnet().setOperator(
        AccountId.fromString(fromAccountId),
        fromKey
      );
      const feeEstimate = Hbar.fromTinybars(1000000);
      const senderTotalBalance = await new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(fromAccountId))
        .execute(this.client);

      const totalRequired = amountHbar
        .toBigNumber()
        .plus(feeEstimate.toBigNumber());
      if (senderTotalBalance.hbars.toBigNumber().lt(totalRequired.toNumber())) {
        const feeTransfer = await new TransferTransaction()
          .addHbarTransfer(this.operatorId, feeEstimate.negated())
          .addHbarTransfer(AccountId.fromString(fromAccountId), feeEstimate)
          .execute(this.client);
        await feeTransfer.getReceipt(this.client);
        console.log(
          `✅ Fee transferred to sender: ${feeTransfer.transactionId}`
        );
      }

      const transferTx = new TransferTransaction()
        .addHbarTransfer(
          AccountId.fromString(fromAccountId),
          amountHbar.negated()
        )
        .addHbarTransfer(AccountId.fromString(toAccountId), amountHbar)
        .setTransactionId(
          TransactionId.generate(AccountId.fromString(fromAccountId))
        );
      const txResponse = await transferTx.execute(clientWithSender);
      const receipt = await txResponse.getReceipt(clientWithSender);

      if (receipt.status.toString() === "SUCCESS") {
        transaction.status = "completed";
        console.log(`✅ HBAR transfer completed: ${txResponse.transactionId}`);
        return {
          success: true,
          txId: txResponse.transactionId.toString(),
          message: `Successfully transferred ${amount} HBAR to ${toAccountId}`,
          transaction,
        };
      } else {
        transaction.status = "failed";
        return {
          success: false,
          message: "Transaction failed during execution",
          transaction,
        };
      }
    } catch (error) {
      console.error("Error transferring HBAR:", error);
      return {
        success: false,
        message: "Failed to transfer HBAR. Please try again later.",
      };
    }
  }

  isValidAccountId(accountId: string): boolean {
    try {
      AccountId.fromString(accountId);
      return true;
    } catch {
      return false;
    }
  }

  async getTransactionReceipt(txId: string): Promise<any | null> {
    try {
      const receipt = await new TransactionReceiptQuery()
        .setTransactionId(txId)
        .execute(this.client);
      return receipt;
    } catch (error) {
      console.error(`Error getting transaction receipt for ${txId}:`, error);
      return null;
    }
  }

  async getTransactionFee(): Promise<string> {
    try {
      const fee = Hbar.fromTinybars(1000000).toString();
      return fee;
    } catch (error) {
      console.error("Error getting transaction fee:", error);
      return "0.001";
    }
  }

  async getOperatorBalance(): Promise<string> {
    try {
      const balance = await new AccountBalanceQuery()
        .setAccountId(this.operatorId)
        .execute(this.client);
      return balance.hbars.toString();
    } catch (error) {
      console.error("Error getting operator balance:", error);
      throw new Error("Failed to get operator balance");
    }
  }

  async associateToken(accountId: string, tokenId: string): Promise<void> {
    if (tokenId === "HBAR") return;
    try {
      const transaction = new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(accountId))
        .setTokenIds([TokenId.fromString(tokenId)]);
      const txResponse = await transaction.execute(this.client);
      await txResponse.getReceipt(this.client);
      console.log(`Associated token ${tokenId} with account ${accountId}`);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT")
      ) {
        console.log(`Token ${tokenId} already associated with ${accountId}`);
      } else {
        throw new Error(
          `Failed to associate token ${tokenId}: ${(error as Error).message}`
        );
      }
    }
  }

  async approveToken(
    accountId: string,
    tokenId: string,
    spender: string,
    amount: number,
    privateKey: string
  ): Promise<void> {
    if (tokenId === "HBAR") return; // Skip for native HBAR
    try {
      const transaction = new ContractExecuteTransaction()
        .setContractId("0.0.19264") // Updated contract ID
        .setGas(100000)
        .setFunction(
          "approve",
          new ContractFunctionParameters()
            .addAddress(TokenId.fromString(tokenId).toSolidityAddress())
            .addUint256(amount)
        )
        .setPayableAmount(Hbar.fromTinybars(0))
        .freezeWith(this.client);
      const signedTx = await transaction.sign(
        PrivateKey.fromStringECDSA(privateKey)
      );
      const txResponse = await signedTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      if (receipt.status.toString() !== "SUCCESS") {
        throw new Error(`Token approval failed: ${receipt.status}`);
      }
      console.log(
        `Approved ${amount} of token ${tokenId} for spender ${spender} by ${accountId}`
      );
    } catch (error) {
      throw new Error(
        `Failed to approve token ${tokenId}: ${(error as Error).message}`
      );
    }
  }

  async swapTokens(
    accountId: string,
    fromTokenId: string,
    toTokenId: string,
    amountIn: number,
    amountOutMin: number,
    deadline: number,
    privateKey: string
  ): Promise<number> {
    try {
      const balanceBefore = await this.getTokenBalance(accountId, toTokenId);
      const path = [
        TokenId.fromString(fromTokenId).toSolidityAddress(),
        TokenId.fromString(toTokenId).toSolidityAddress(),
      ];
      const transaction = new ContractExecuteTransaction()
        .setContractId("0.0.19264") // Updated contract ID
        .setGas(200000)
        .setFunction(
          "swapExactTokensForTokens",
          new ContractFunctionParameters()
            .addUint256(amountIn)
            .addUint256(amountOutMin)
            .addAddressArray(path)
            .addAddress(AccountId.fromString(accountId).toSolidityAddress())
            .addUint256(deadline)
        )
        .setPayableAmount(Hbar.fromTinybars(0))
        .freezeWith(this.client);
      const signedTx = await transaction.sign(
        PrivateKey.fromStringECDSA(privateKey)
      );
      const txResponse = await signedTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      if (receipt.status.toString() !== "SUCCESS") {
        throw new Error(`Swap failed: ${receipt.status}`);
      }
      const balanceAfter = await this.getTokenBalance(accountId, toTokenId);
      const amountOut = balanceAfter - balanceBefore;
      console.log(
        `Swapped ${amountIn} ${fromTokenId} to ${amountOut} ${toTokenId} for ${accountId}`
      );
      return amountOut;
    } catch (error) {
      throw new Error(`Failed to swap tokens: ${(error as Error).message}`);
    }
  }

  // Fixed swapHBARForTokens method for blockchain.service.ts

  async swapHBARForTokens(
    accountId: string,
    toTokenId: string,
    amountIn: number,
    amountOutMin: number,
    deadline: number,
    privateKey: string
  ): Promise<number> {
    try {
      if (isNaN(amountIn) || amountIn <= 0 || !Number.isInteger(amountIn)) {
        throw new Error("Invalid amountIn: must be a positive integer");
      }

      const balanceBefore = await this.getTokenBalance(accountId, toTokenId);
      const path = [
        TokenId.fromString("0.0.15058").toSolidityAddress(), // WHBAR
        TokenId.fromString(toTokenId).toSolidityAddress(),
      ];

      // Fix: Use BigInt to handle large numbers properly
      const amountInBigInt = BigInt(amountIn);

      const transaction = new ContractExecuteTransaction()
        .setContractId("0.0.19264")
        .setGas(250000)
        .setFunction(
          "swapExactETHForTokens",
          new ContractFunctionParameters()
            .addUint256(amountOutMin)
            .addAddressArray(path)
            .addAddress(AccountId.fromString(accountId).toSolidityAddress())
            .addUint256(deadline)
        )
        .setPayableAmount(Hbar.fromTinybars(amountInBigInt.toString()))
        .freezeWith(this.client);
      const signedTx = await transaction.sign(
        PrivateKey.fromStringECDSA(privateKey)
      );
      const txResponse = await signedTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      if (receipt.status.toString() !== "SUCCESS") {
        throw new Error(`Swap failed: ${receipt.status}`);
      }

      const balanceAfter = await this.getTokenBalance(accountId, toTokenId);
      const amountOut = balanceAfter - balanceBefore;

      console.log(
        `Swapped ${amountIn} tinybars HBAR to ${amountOut} ${toTokenId} for ${accountId}`
      );

      return amountOut;
    } catch (error) {
      throw new Error(
        `Failed to swap HBAR for tokens: ${(error as Error).message}`
      );
    }
  }

  async swapTokensForHBAR(
    accountId: string,
    fromTokenId: string,
    amountIn: number,
    amountOutMin: number,
    deadline: number,
    privateKey: string
  ): Promise<number> {
    try {
      const balanceBefore = await this.getHBARBalance(accountId);
      const balanceBeforeNum = parseFloat(balanceBefore) * 1e8; // Convert to tinybars

      const path = [
        TokenId.fromString(fromTokenId).toSolidityAddress(),
        TokenId.fromString("0.0.15058").toSolidityAddress(), // WHBAR
      ];

      const transaction = new ContractExecuteTransaction()
        .setContractId("0.0.19264")
        .setGas(250000)
        .setFunction(
          "swapExactTokensForETH",
          new ContractFunctionParameters()
            .addUint256(amountIn)
            .addUint256(amountOutMin)
            .addAddressArray(path)
            .addAddress(AccountId.fromString(accountId).toSolidityAddress())
            .addUint256(deadline)
        )
        .setPayableAmount(Hbar.fromTinybars(0))
        .freezeWith(this.client); // Add freeze before signing

      const signedTx = await transaction.sign(
        PrivateKey.fromStringECDSA(privateKey)
      );
      const txResponse = await signedTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      if (receipt.status.toString() !== "SUCCESS") {
        throw new Error(`Swap failed: ${receipt.status}`);
      }

      const balanceAfter = await this.getHBARBalance(accountId);
      const balanceAfterNum = parseFloat(balanceAfter) * 1e8; // Convert to tinybars
      const amountOut = balanceAfterNum - balanceBeforeNum;

      console.log(
        `Swapped ${amountIn} ${fromTokenId} to ${amountOut} tinybars HBAR for ${accountId}`
      );

      return amountOut;
    } catch (error) {
      throw new Error(
        `Failed to swap tokens for HBAR: ${(error as Error).message}`
      );
    }
  }

  // Fixed getAmountsOut method for blockchain.service.ts

  async getAmountsOut(amountIn: number, path: string[]): Promise<number[]> {
    try {
      // Create the contract call transaction
      const transaction = new ContractCallQuery()
        .setContractId("0.0.19264")
        .setGas(100000)
        .setFunction(
          "getAmountsOut",
          new ContractFunctionParameters().addUint256(amountIn).addAddressArray(
            path.map((id) => {
              // Handle both token IDs and WHBAR (native wrapper)
              if (id === "0.0.15058") {
                return TokenId.fromString(id).toSolidityAddress();
              }
              return TokenId.fromString(id).toSolidityAddress();
            })
          )
        );

      // Execute the query
      const contractCallResult = await transaction.execute(this.client);

      // The result should be an array of amounts
      // Parse the result based on the Uniswap V2 Router interface
      // getAmountsOut returns uint256[] memory amounts
      const amounts: number[] = [];

      // The function returns an array, we need to extract it properly
      // Typically the first element is the input amount, and subsequent elements are the output amounts
      for (let i = 0; i < path.length; i++) {
        // Get each uint256 from the result array
        const amount = contractCallResult.getUint256(i);
        amounts.push(Number(amount));
      }

      // If we couldn't get the amounts properly, return a fallback
      if (amounts.length === 0) {
        // Fallback: return the input amount and a rough estimate
        return [amountIn, Math.floor(amountIn * 0.98)]; // 2% slippage estimate
      }

      return amounts;
    } catch (error) {
      console.error("Failed to get amounts out:", error);
      // Fallback: return the input amount and a rough estimate
      return [amountIn, Math.floor(amountIn * 0.98)]; // 2% slippage estimate
    }
  }

  // Note: You'll need to import ContractCallQuery at the top of the file:
  // import { ContractCallQuery } from "@hashgraph/sdk";
}

export const hederaBlockchainModel = new HederaBlockchainModel();
```
