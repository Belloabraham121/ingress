import { Request, Response } from "express";
import { ethers } from "ethers";
import {
  Client,
  PrivateKey,
  AccountId,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
} from "@hashgraph/sdk";
import { Wallet } from "../models/Wallet";
import { walletGeneratorService } from "../services/walletGenerator.service";
import { getEvmAddressFromAccountId } from "../utils/hedera";
import { env } from "../config/env";

const HEDERA_TESTNET_RPC = "https://testnet.hashio.io/api";

/**
 * Convert EVM address to Hedera ContractId
 * @param evmAddress - EVM address (0x...)
 * @returns ContractId
 */
function evmAddressToContractId(evmAddress: string): ContractId {
  // Remove 0x prefix if present
  const cleanAddress = evmAddress.startsWith("0x")
    ? evmAddress.slice(2)
    : evmAddress;

  // Convert hex to ContractId (shard 0, realm 0 for testnet)
  return ContractId.fromEvmAddress(0, 0, cleanAddress);
}

/**
 * Sign an ERC20 approve transaction
 * POST /api/vault/sign-approve
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

    const { tokenAddress, spenderAddress, amount } = req.body;

    // Validate input
    if (!tokenAddress || !spenderAddress || !amount) {
      res.status(400).json({
        success: false,
        message: "tokenAddress, spenderAddress, and amount are required",
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
      spenderAddress,
      amount,
    ]);

    // Convert EVM address to Hedera ContractId
    const tokenContractId = evmAddressToContractId(tokenAddress);

    console.log(`Token EVM Address: ${tokenAddress}`);
    console.log(`Token Contract ID: ${tokenContractId.toString()}`);

    // Send approve transaction using Hedera SDK
    console.log(`Approving ${amount} tokens for spender ${spenderAddress}...`);

    const transaction = new ContractExecuteTransaction()
      .setContractId(tokenContractId)
      .setGas(500000) // Increased gas limit for approve
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
        blockNumber: 0, // Hedera doesn't use block numbers the same way
        status: receipt.status.toString() === "SUCCESS" ? 1 : 0,
        gasUsed: "0", // Gas info not readily available from Hedera SDK receipt
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
 * Sign a vault deposit transaction
 * POST /api/vault/sign-deposit
 */
export const signDeposit = async (
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

    const { vaultAddress, amount } = req.body;

    // Validate input
    if (!vaultAddress || !amount) {
      res.status(400).json({
        success: false,
        message: "vaultAddress and amount are required",
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

    // Encode deposit function call
    const depositInterface = new ethers.Interface([
      "function deposit(uint256 amount)",
    ]);
    const depositData = depositInterface.encodeFunctionData("deposit", [
      amount,
    ]);

    // Convert EVM address to Hedera ContractId
    const vaultContractId = evmAddressToContractId(vaultAddress);

    console.log(`Vault EVM Address: ${vaultAddress}`);
    console.log(`Vault Contract ID: ${vaultContractId.toString()}`);

    // Send deposit transaction using Hedera SDK
    console.log(`Depositing ${amount} tokens into vault ${vaultAddress}...`);

    const transaction = new ContractExecuteTransaction()
      .setContractId(vaultContractId)
      .setGas(800000) // Increased gas limit for deposit (complex vault logic)
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
      message: "Vault deposit successful",
      data: {
        transactionHash: txResponse.transactionId.toString(),
        blockNumber: 0, // Hedera doesn't use block numbers the same way
        status: receipt.status.toString() === "SUCCESS" ? 1 : 0,
        gasUsed: "0", // Gas info not readily available from Hedera SDK receipt
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
 * Get token allowance
 * GET /api/vault/allowance
 */
export const getAllowance = async (
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

    const { tokenAddress, spenderAddress } = req.query;

    // Validate input
    if (!tokenAddress || !spenderAddress) {
      res.status(400).json({
        success: false,
        message: "tokenAddress and spenderAddress are required",
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

    // ERC20 allowance ABI
    const allowanceABI = [
      "function allowance(address owner, address spender) view returns (uint256)",
    ];

    // Create contract instance
    const tokenContract = new ethers.Contract(
      tokenAddress as string,
      allowanceABI,
      provider
    );

    // Get allowance using derived EVM address
    const allowance = await tokenContract.allowance(evmAddress, spenderAddress);

    res.status(200).json({
      success: true,
      data: {
        allowance: allowance.toString(),
        formattedAllowance: ethers.formatUnits(allowance, 18),
      },
    });
  } catch (error: any) {
    console.error("Error getting allowance:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get allowance",
    });
  }
};
