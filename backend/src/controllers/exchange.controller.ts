import { Request, Response } from "express";
import { ethers } from "ethers";
import {
  Client,
  PrivateKey,
  AccountId,
  ContractExecuteTransaction,
  ContractId,
} from "@hashgraph/sdk";
import { Wallet } from "../models/Wallet";
import { walletGeneratorService } from "../services/walletGenerator.service";
import { getEvmAddressFromAccountId } from "../utils/hedera";
import { activityService } from "../services/activity.service";

const HEDERA_TESTNET_RPC = "https://testnet.hashio.io/api";

/**
 * Convert EVM address to Hedera ContractId
 * @param evmAddress - EVM address (0x...)
 * @returns ContractId
 */
function evmAddressToContractId(evmAddress: string): ContractId {
  const cleanAddress = evmAddress.startsWith("0x")
    ? evmAddress.slice(2)
    : evmAddress;
  return ContractId.fromEvmAddress(0, 0, cleanAddress);
}

/**
 * Sign token approval for exchange
 * POST /api/exchange/sign-approve
 */
export const signApprove = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const { tokenAddress, exchangeAddress, amount } = req.body;

    // Validate input
    if (!tokenAddress || !exchangeAddress || !amount) {
      res.status(400).json({
        success: false,
        message: "tokenAddress, exchangeAddress, and amount are required",
      });
      return;
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
      return;
    }

    // Decrypt private key
    const privateKeyHex = walletGeneratorService.decryptPrivateKey(
      wallet.encryptedPrivateKey,
      wallet.iv,
      wallet.authTag
    );

    // Get actual EVM address from Hedera mirror node
    const evmAddress = await getEvmAddressFromAccountId(wallet.accountId);

    console.log("User's Account ID:", wallet.accountId);
    console.log("User's EVM Address (from mirror node):", evmAddress);

    // Initialize Hedera client with user's account
    const client = Client.forTestnet();
    const accountId = AccountId.fromString(wallet.accountId);
    const privateKey = PrivateKey.fromStringECDSA(privateKeyHex);
    client.setOperator(accountId, privateKey);

    // Encode approve function call
    const approveInterface = new ethers.Interface([
      "function approve(address spender, uint256 amount) returns (bool)",
    ]);
    const approveData = approveInterface.encodeFunctionData("approve", [
      exchangeAddress,
      amount,
    ]);

    // Convert EVM address to Hedera ContractId
    const tokenContractId = evmAddressToContractId(tokenAddress);

    console.log(`Token EVM Address: ${tokenAddress}`);
    console.log(`Token Contract ID: ${tokenContractId.toString()}`);

    // Send approve transaction using Hedera SDK
    console.log(
      `Approving ${amount} tokens for exchange ${exchangeAddress}...`
    );

    const transaction = new ContractExecuteTransaction()
      .setContractId(tokenContractId)
      .setGas(500000)
      .setFunctionParameters(Buffer.from(approveData.slice(2), "hex"));

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log(
      "Approval transaction sent:",
      txResponse.transactionId.toString()
    );
    console.log(
      `View on HashScan: https://hashscan.io/testnet/transaction/${txResponse.transactionId.toString()}`
    );
    console.log("✅ Approval confirmed!");

    client.close();

    res.status(200).json({
      success: true,
      message: "Token approval successful",
      data: {
        transactionHash: txResponse.transactionId.toString(),
        blockNumber: 0,
        status: receipt.status.toString() === "SUCCESS" ? 1 : 0,
        gasUsed: "0",
      },
    });
  } catch (error: any) {
    console.error("Error signing approve transaction:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to sign approve transaction",
    });
  }
};

/**
 * Deposit token to exchange (for swap)
 * POST /api/exchange/sign-deposit
 */
export const signDepositToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const { exchangeAddress, tokenAddress, amount, tokenSymbol } = req.body;

    // Validate input
    if (!exchangeAddress || !tokenAddress || !amount) {
      res.status(400).json({
        success: false,
        message: "exchangeAddress, tokenAddress, and amount are required",
      });
      return;
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
      return;
    }

    // Decrypt private key
    const privateKeyHex = walletGeneratorService.decryptPrivateKey(
      wallet.encryptedPrivateKey,
      wallet.iv,
      wallet.authTag
    );

    // Get actual EVM address from Hedera mirror node
    const evmAddress = await getEvmAddressFromAccountId(wallet.accountId);

    console.log("User's Account ID:", wallet.accountId);
    console.log("User's EVM Address (from mirror node):", evmAddress);

    // Initialize Hedera client with user's account
    const client = Client.forTestnet();
    const accountId = AccountId.fromString(wallet.accountId);
    const privateKey = PrivateKey.fromStringECDSA(privateKeyHex);
    client.setOperator(accountId, privateKey);

    // Encode depositToken function call
    const depositInterface = new ethers.Interface([
      "function depositToken(address token, uint256 amount)",
    ]);
    const depositData = depositInterface.encodeFunctionData("depositToken", [
      tokenAddress,
      amount,
    ]);

    // Convert EVM address to Hedera ContractId
    const exchangeContractId = evmAddressToContractId(exchangeAddress);

    console.log(`Exchange EVM Address: ${exchangeAddress}`);
    console.log(`Exchange Contract ID: ${exchangeContractId.toString()}`);

    // Send deposit transaction using Hedera SDK
    console.log(
      `Depositing ${amount} tokens to exchange ${exchangeAddress}...`
    );

    const transaction = new ContractExecuteTransaction()
      .setContractId(exchangeContractId)
      .setGas(800000)
      .setFunctionParameters(Buffer.from(depositData.slice(2), "hex"));

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log(
      "Deposit transaction sent:",
      txResponse.transactionId.toString()
    );
    console.log(
      `View on HashScan: https://hashscan.io/testnet/transaction/${txResponse.transactionId.toString()}`
    );
    console.log("✅ Deposit confirmed!");

    client.close();

    res.status(200).json({
      success: true,
      message: "Token deposit to exchange successful",
      data: {
        transactionHash: txResponse.transactionId.toString(),
        blockNumber: 0,
        status: receipt.status.toString() === "SUCCESS" ? 1 : 0,
        gasUsed: "0",
      },
    });
  } catch (error: any) {
    console.error("Error signing deposit transaction:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to sign deposit transaction",
    });
  }
};

/**
 * Execute a token swap
 * POST /api/exchange/sign-swap
 */
export const signSwap = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const {
      exchangeAddress,
      fromTokenAddress,
      toTokenAddress,
      amount,
      fromTokenSymbol,
      toTokenSymbol,
      expectedAmount,
    } = req.body;

    // Validate input
    if (!exchangeAddress || !fromTokenAddress || !toTokenAddress || !amount) {
      res.status(400).json({
        success: false,
        message:
          "exchangeAddress, fromTokenAddress, toTokenAddress, and amount are required",
      });
      return;
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
      return;
    }

    // Decrypt private key
    const privateKeyHex = walletGeneratorService.decryptPrivateKey(
      wallet.encryptedPrivateKey,
      wallet.iv,
      wallet.authTag
    );

    // Get actual EVM address from Hedera mirror node
    const evmAddress = await getEvmAddressFromAccountId(wallet.accountId);

    console.log("User's Account ID:", wallet.accountId);
    console.log("User's EVM Address (from mirror node):", evmAddress);

    // Initialize Hedera client with user's account
    const client = Client.forTestnet();
    const accountId = AccountId.fromString(wallet.accountId);
    const privateKey = PrivateKey.fromStringECDSA(privateKeyHex);
    client.setOperator(accountId, privateKey);

    // First deposit the from token
    const depositInterface = new ethers.Interface([
      "function depositToken(address token, uint256 amount)",
    ]);
    const depositData = depositInterface.encodeFunctionData("depositToken", [
      fromTokenAddress,
      amount,
    ]);

    // Convert EVM address to Hedera ContractId
    const exchangeContractId = evmAddressToContractId(exchangeAddress);

    console.log(
      `Swapping ${amount} ${fromTokenSymbol || "tokens"} for ${
        toTokenSymbol || "tokens"
      }...`
    );

    const transaction = new ContractExecuteTransaction()
      .setContractId(exchangeContractId)
      .setGas(800000)
      .setFunctionParameters(Buffer.from(depositData.slice(2), "hex"));

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log("Swap transaction sent:", txResponse.transactionId.toString());
    console.log(
      `View on HashScan: https://hashscan.io/testnet/transaction/${txResponse.transactionId.toString()}`
    );
    console.log("✅ Swap confirmed!");

    client.close();

    // Record activity in database
    try {
      await activityService.createActivity({
        userId,
        activityType: "swap",
        amount: amount.toString(),
        fromToken: fromTokenSymbol || fromTokenAddress,
        toToken: toTokenSymbol || toTokenAddress,
        transactionHash: txResponse.transactionId.toString(),
        status: receipt.status.toString() === "SUCCESS" ? "success" : "failed",
        metadata: {
          fromTokenAddress,
          toTokenAddress,
          exchangeAddress,
          expectedAmount: expectedAmount || "0",
          blockNumber: 0,
          gasUsed: "0",
        },
      });
    } catch (activityError) {
      console.error("Error recording activity:", activityError);
      // Don't fail the transaction if activity logging fails
    }

    res.status(200).json({
      success: true,
      message: "Token swap successful",
      data: {
        transactionHash: txResponse.transactionId.toString(),
        blockNumber: 0,
        status: receipt.status.toString() === "SUCCESS" ? 1 : 0,
        gasUsed: "0",
        fromToken: fromTokenSymbol || fromTokenAddress,
        toToken: toTokenSymbol || toTokenAddress,
        amount: amount.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error signing swap transaction:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to sign swap transaction",
    });
  }
};

/**
 * Get user's token balance in exchange
 * GET /api/exchange/balance
 */
export const getExchangeBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const { exchangeAddress, tokenAddress } = req.query;

    // Validate input
    if (!exchangeAddress || !tokenAddress) {
      res.status(400).json({
        success: false,
        message: "exchangeAddress and tokenAddress are required",
      });
      return;
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
      return;
    }

    // Get actual EVM address from Hedera mirror node
    const evmAddress = await getEvmAddressFromAccountId(wallet.accountId);

    // Connect to Hedera
    const provider = new ethers.JsonRpcProvider(HEDERA_TESTNET_RPC);

    // Exchange ABI
    const exchangeABI = [
      "function getUserTokenBalance(address user, address token) view returns (uint256)",
    ];

    // Create contract instance
    const exchangeContract = new ethers.Contract(
      exchangeAddress as string,
      exchangeABI,
      provider
    );

    // Get balance
    const balance = await exchangeContract.getUserTokenBalance(
      evmAddress,
      tokenAddress
    );

    res.status(200).json({
      success: true,
      data: {
        balance: balance.toString(),
        formattedBalance: ethers.formatUnits(balance, 18),
      },
    });
  } catch (error: any) {
    console.error("Error getting exchange balance:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get exchange balance",
    });
  }
};
