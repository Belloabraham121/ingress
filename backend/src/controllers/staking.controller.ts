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
 * Sign an ERC20 approve transaction for staking
 * POST /api/staking/sign-approve
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
    console.log(
      `Approving ${amount} tokens for staking pool ${spenderAddress}...`
    );

    const transaction = new ContractExecuteTransaction()
      .setContractId(tokenContractId)
      .setGas(500000) // Gas limit for approve
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
 * Sign a stake transaction
 * POST /api/staking/sign-stake
 */
export const signStake = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const { stakingPoolAddress, poolId, amount, poolName, tokenSymbol } =
      req.body;

    // Validate input
    if (!stakingPoolAddress || poolId === undefined || !amount) {
      res.status(400).json({
        success: false,
        message: "stakingPoolAddress, poolId, and amount are required",
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

    // Encode stake function call
    const stakeInterface = new ethers.Interface([
      "function stake(uint256 poolId, uint256 amount)",
    ]);
    const stakeData = stakeInterface.encodeFunctionData("stake", [
      poolId,
      amount,
    ]);

    // Convert EVM address to Hedera ContractId
    const stakingPoolContractId = evmAddressToContractId(stakingPoolAddress);

    console.log(`Staking Pool EVM Address: ${stakingPoolAddress}`);
    console.log(
      `Staking Pool Contract ID: ${stakingPoolContractId.toString()}`
    );

    // Send stake transaction using Hedera SDK
    console.log(
      `Staking ${amount} tokens in pool ${poolId} at ${stakingPoolAddress}...`
    );

    const transaction = new ContractExecuteTransaction()
      .setContractId(stakingPoolContractId)
      .setGas(800000) // Higher gas limit for staking (complex logic)
      .setFunctionParameters(Buffer.from(stakeData.slice(2), "hex"));

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log("Stake transaction sent:", txResponse.transactionId.toString());
    console.log(
      `View on HashScan: https://hashscan.io/testnet/transaction/${txResponse.transactionId.toString()}`
    );
    console.log("✅ Stake confirmed!");

    client.close();

    // Record activity in database
    try {
      await activityService.createActivity({
        userId,
        activityType: "stake",
        amount: amount.toString(),
        tokenSymbol: tokenSymbol || "USDT",
        poolName: poolName || `Pool ${poolId}`,
        poolId,
        stakingPoolAddress,
        transactionHash: txResponse.transactionId.toString(),
        status: receipt.status.toString() === "SUCCESS" ? "success" : "failed",
        metadata: {
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
      message: "Staking successful",
      data: {
        transactionHash: txResponse.transactionId.toString(),
        blockNumber: 0,
        status: receipt.status.toString() === "SUCCESS" ? 1 : 0,
        gasUsed: "0",
      },
    });
  } catch (error: any) {
    console.error("Error signing stake transaction:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to sign stake transaction",
    });
  }
};

/**
 * Get token allowance for staking pool
 * GET /api/staking/allowance
 */
/**
 * Sign a stake withdrawal transaction
 * POST /api/staking/sign-withdraw
 */
export const signWithdraw = async (
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

    const { stakingPoolAddress, poolId, amount, poolName, tokenSymbol } =
      req.body;

    // Validate input
    if (!stakingPoolAddress || poolId === undefined || !amount) {
      res.status(400).json({
        success: false,
        message: "stakingPoolAddress, poolId, and amount are required",
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

    // Encode withdraw function call
    const withdrawInterface = new ethers.Interface([
      "function withdraw(uint256 poolId, uint256 amount)",
    ]);
    const withdrawData = withdrawInterface.encodeFunctionData("withdraw", [
      poolId,
      amount,
    ]);

    // Convert EVM address to Hedera ContractId
    const stakingPoolContractId = evmAddressToContractId(stakingPoolAddress);

    console.log(`Staking Pool EVM Address: ${stakingPoolAddress}`);
    console.log(
      `Staking Pool Contract ID: ${stakingPoolContractId.toString()}`
    );

    // Send withdraw transaction using Hedera SDK
    console.log(
      `Withdrawing ${amount} tokens from pool ${poolId} at ${stakingPoolAddress}...`
    );

    const transaction = new ContractExecuteTransaction()
      .setContractId(stakingPoolContractId)
      .setGas(800000) // Gas limit for withdrawal
      .setFunctionParameters(Buffer.from(withdrawData.slice(2), "hex"));

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log(
      "Withdrawal transaction sent:",
      txResponse.transactionId.toString()
    );
    console.log(
      `View on HashScan: https://hashscan.io/testnet/transaction/${txResponse.transactionId.toString()}`
    );
    console.log("✅ Withdrawal confirmed!");

    client.close();

    // Record activity in database
    try {
      await activityService.createActivity({
        userId,
        activityType: "withdraw_stake",
        amount: amount.toString(),
        tokenSymbol: tokenSymbol || "USDT",
        poolName: poolName || `Pool ${poolId}`,
        poolId,
        stakingPoolAddress,
        transactionHash: txResponse.transactionId.toString(),
        status: receipt.status.toString() === "SUCCESS" ? "success" : "failed",
        metadata: {
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
      message: "Staking withdrawal successful",
      data: {
        transactionHash: txResponse.transactionId.toString(),
        blockNumber: 0,
        status: receipt.status.toString() === "SUCCESS" ? 1 : 0,
        gasUsed: "0",
      },
    });
  } catch (error: any) {
    console.error("Error signing withdrawal transaction:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to sign withdrawal transaction",
    });
  }
};

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
