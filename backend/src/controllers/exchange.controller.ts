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

/**
 * Get exchange rates
 * GET /api/exchange/rates
 */
export const getExchangeRates = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { exchangeService } = await import("../services/exchange.service");
    const rates = await exchangeService.getExchangeRates();

    res.status(200).json({
      success: true,
      data: {
        rates,
        tokens: {
          usdc: "0x125D3f690f281659Dd7708D21688BC83Ee534aE6",
          usdt: "0xd4E61131Ed9C3dd610727655aE8254B286deE95c",
          dai: "0x3814F5Cf6c4Aa63EdDF8A79c82346a163c7E7C53",
        },
      },
    });
  } catch (error: any) {
    console.error("Error getting exchange rates:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get exchange rates",
    });
  }
};

/**
 * Calculate swap output
 * POST /api/exchange/calculate
 */
export const calculateSwapOutput = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { fromToken, toToken, amount } = req.body;

    if (!fromToken || !toToken || !amount) {
      res.status(400).json({
        success: false,
        message: "fromToken, toToken, and amount are required",
      });
      return;
    }

    const { exchangeService } = await import("../services/exchange.service");
    const result = await exchangeService.calculateSwapOutput(
      fromToken,
      toToken,
      amount
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error calculating swap output:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate swap output",
    });
  }
};

/**
 * Cash out Token → Naira immediately after deposit
 * POST /api/exchange/cashout-token
 * Body: { tokenAddress, amountSmallest, tokenDecimals }
 */
export const cashoutTokenToNaira = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { tokenAddress, amountSmallest, tokenDecimals } = req.body;

    console.log("[cashout] payload:", {
      tokenAddress,
      amountSmallest,
      tokenDecimals,
    });

    if (!tokenAddress || !amountSmallest) {
      res.status(400).json({
        success: false,
        message: "tokenAddress and amountSmallest are required",
      });
      return;
    }

    // Get wallet and user
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.status(404).json({ success: false, message: "Wallet not found" });
      return;
    }

    const { User } = await import("../models/User");
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Bank account validation
    const { BankAccount } = await import("../models/BankAccount");
    const bankAccount = await BankAccount.findOne({ userId: user._id });
    if (!bankAccount) {
      res.status(400).json({
        success: false,
        message: "No bank account found. Link a bank account to cash out.",
      });
      return;
    }

    // Compute human amount and Naira value
    const decimals = Number.isFinite(tokenDecimals)
      ? Number(tokenDecimals)
      : 18;
    const humanAmount = Number(
      ethers.formatUnits(BigInt(amountSmallest), decimals)
    );

    const { priceOracleService } = await import(
      "../services/priceOracle.service"
    );

    // Determine token symbol for rate lookup
    const addressToSymbol: Record<string, string> = {
      [tokenAddress.toLowerCase()]: "TOKEN",
    };
    // Optional: map known addresses
    // addressToSymbol[USDT_ADDRESS] = "USDT"; etc.

    // Fallback to generic token→NGN conversion via calculateSwapOutput
    const { exchangeService } = await import("../services/exchange.service");
    const calc = await exchangeService.calculateSwapOutput(
      tokenAddress,
      "NGN",
      humanAmount
    );

    const naira = calc.output;
    const kobo = Math.round(naira * 100);

    console.log("[cashout] computed:", {
      humanAmount,
      naira,
      kobo,
    });

    // Ensure transfer recipient
    const { paystackService } = await import("../services/paystack.service");

    let recipientCode = bankAccount.recipientCode;
    if (!recipientCode) {
      // Normalize bank code for test mode
      let normalizedBankCode = bankAccount.bankCode;
      let normalizedAccountNumber = bankAccount.accountNumber;
      try {
        const banksResp = await paystackService.getBanks();
        if (
          (!normalizedBankCode || normalizedBankCode === "test-bank") &&
          banksResp.status &&
          Array.isArray(banksResp.data)
        ) {
          // Pick a common NGN bank (GTBank or first in list) for test
          const gt = banksResp.data.find((b: any) =>
            (b.name || "").toLowerCase().includes("guaranty")
          );
          const first = banksResp.data[0];
          normalizedBankCode = (gt?.code || first?.code || "058").toString();
          console.log("[cashout] resolved test bankCode:", normalizedBankCode);
        }
      } catch (e) {
        console.log(
          "[cashout] getBanks failed, using default code 058 (GTBank)"
        );
        if (!normalizedBankCode || normalizedBankCode === "test-bank") {
          normalizedBankCode = "058";
        }
      }
      // Ensure 10-digit account number in test
      if (!/^\d{10}$/.test(normalizedAccountNumber || "")) {
        normalizedAccountNumber = "0000000000";
        console.log("[cashout] using test account number 0000000000");
      }

      console.log("[cashout] creating transfer recipient for:", {
        name: `${user.firstName} ${user.lastName}`,
        accountNumber: normalizedAccountNumber,
        bankCode: normalizedBankCode,
      });
      const recipient = await paystackService.createTransferRecipient(
        `${user.firstName} ${user.lastName}`,
        normalizedAccountNumber,
        normalizedBankCode
      );
      if (!recipient.status) {
        console.warn("[cashout] initial recipient creation failed:", recipient);
        // Fallback for Paystack test: Zenith Bank (transfer) Code 057, Account 0000000000
        const fallbackBankCode = "057"; // Zenith (transfer)
        const fallbackAccount = "0000000000";
        console.log("[cashout] retrying with fallback test details:", {
          fallbackBankCode,
          fallbackAccount,
        });
        const recipientFallback = await paystackService.createTransferRecipient(
          `${user.firstName} ${user.lastName}`,
          fallbackAccount,
          fallbackBankCode
        );
        if (!recipientFallback.status) {
          res.status(400).json({
            success: false,
            message:
              recipientFallback.message ||
              "Failed to create transfer recipient (test fallback)",
          });
          return;
        }
        recipientCode = recipientFallback.data.recipient_code;
        bankAccount.recipientCode = recipientCode;
        await bankAccount.save();
      } else {
        recipientCode = recipient.data.recipient_code;
        bankAccount.recipientCode = recipientCode;
        await bankAccount.save();
      }
    }

    // Initiate transfer
    console.log("[cashout] initiating transfer:", { kobo, recipientCode });
    const transfer = await paystackService.initiateTransfer(
      recipientCode as string,
      kobo,
      `Cashout: ${humanAmount} tokens`
    );
    if (!transfer.status) {
      res.status(400).json({
        success: false,
        message: transfer.message || "Failed to initiate transfer",
      });
      return;
    }

    // Log activity
    try {
      await activityService.createActivity({
        userId,
        activityType: "swap",
        amount: humanAmount.toString(),
        fromToken: tokenAddress,
        toToken: "NGN",
        transactionHash: transfer.data.transfer_code,
        status: "success",
        metadata: {
          direction: "token_to_naira",
          nairaAmount: naira.toString(),
          kobo,
        },
      });
    } catch {}

    res.status(200).json({
      success: true,
      message: "Cashout initiated",
      data: {
        transferCode: transfer.data.transfer_code,
        naira,
      },
    });
  } catch (error: any) {
    console.error("[cashout] error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Direct Token → Token swap (no PayStack). Assumes user has deposited the fromToken.
 * POST /api/exchange/swap-token-token
 */
export const swapTokenToToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const {
      fromTokenAddress,
      toTokenAddress,
      fromAmountSmallest, // string
      fromTokenDecimals,
      toTokenDecimals,
    } = req.body;

    console.log("[swapTokenToToken] incoming payload:", {
      fromTokenAddress,
      toTokenAddress,
      fromAmountSmallest,
      fromTokenDecimals,
      toTokenDecimals,
    });

    if (!fromTokenAddress || !toTokenAddress || !fromAmountSmallest) {
      res.status(400).json({
        success: false,
        message:
          "fromTokenAddress, toTokenAddress and fromAmountSmallest are required",
      });
      return;
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.status(404).json({ success: false, message: "Wallet not found" });
      return;
    }

    const evmAddress = await getEvmAddressFromAccountId(wallet.accountId);
    console.log("[swapTokenToToken] user accountId → evm:", {
      accountId: wallet.accountId,
      evmAddress,
    });

    // Calculate output via exchange service
    const { exchangeService } = await import("../services/exchange.service");

    const decimalsFrom = Number.isFinite(fromTokenDecimals)
      ? Number(fromTokenDecimals)
      : 18;
    const decimalsTo = Number.isFinite(toTokenDecimals)
      ? Number(toTokenDecimals)
      : 18;

    const humanFromAmount = Number(
      ethers.formatUnits(BigInt(fromAmountSmallest), decimalsFrom)
    );
    console.log("[swapTokenToToken] humanFromAmount:", humanFromAmount);

    const calc = await exchangeService.calculateSwapOutput(
      fromTokenAddress,
      toTokenAddress,
      humanFromAmount
    );
    console.log("[swapTokenToToken] calculated output:", calc);

    const toAmountSmallest = ethers.parseUnits(
      calc.output.toFixed(decimalsTo),
      decimalsTo
    );
    console.log(
      "[swapTokenToToken] toAmountSmallest:",
      toAmountSmallest.toString()
    );

    // Validate admin credentials
    if (!process.env.ADMIN_ACCOUNT_ID || !process.env.ADMIN_PRIVATE_KEY) {
      res.status(500).json({
        success: false,
        message:
          "Server misconfiguration: ADMIN_ACCOUNT_ID/ADMIN_PRIVATE_KEY not set",
      });
      return;
    }

    // Execute transferToUser via Hedera SDK (admin)
    const client = Client.forTestnet();
    const adminAccountId = AccountId.fromString(process.env.ADMIN_ACCOUNT_ID);
    const adminPrivateKey = PrivateKey.fromStringECDSA(
      process.env.ADMIN_PRIVATE_KEY
    );
    client.setOperator(adminAccountId, adminPrivateKey);
    console.log("[swapTokenToToken] admin:", {
      adminAccountId: adminAccountId.toString(),
      exchangeContract: process.env.EXCHANGE_CONTRACT,
    });

    const exchangeAddress =
      process.env.EXCHANGE_CONTRACT ||
      "0x1938C3345f2B6B2Fa3538713DB50f80ebA3a61d5";
    const exchangeContractId = evmAddressToContractId(exchangeAddress);

    const iface = new ethers.Interface([
      "function transferToUser(address token, address to, uint256 amount)",
    ]);
    const callData = iface.encodeFunctionData("transferToUser", [
      toTokenAddress,
      evmAddress,
      toAmountSmallest,
    ]);

    const tx = new ContractExecuteTransaction()
      .setContractId(exchangeContractId)
      .setGas(800000)
      .setFunctionParameters(Buffer.from(callData.slice(2), "hex"));

    const txResp = await tx.execute(client);
    const receipt = await txResp.getReceipt(client);
    console.log("[swapTokenToToken] tx sent:", {
      txId: txResp.transactionId.toString(),
      status: receipt.status.toString(),
    });

    // Log activity
    try {
      await activityService.createActivity({
        userId,
        activityType: "swap",
        amount: calc.output.toString(),
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        transactionHash: txResp.transactionId.toString(),
        status: receipt.status.toString() === "SUCCESS" ? "success" : "failed",
        metadata: {
          direction: "token_to_token",
          fromAmount: humanFromAmount.toString(),
        },
      });
    } catch {}

    res.status(200).json({
      success: true,
      message: "Swap executed",
      data: {
        transactionHash: txResp.transactionId.toString(),
        amountOut: calc.output,
      },
    });
  } catch (error: any) {
    console.error("Error swapping token to token:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to swap token to token",
    });
  }
};

/**
 * HBAR → Token swap (direct via Exchange, no Paystack)
 * POST /api/exchange/swap-hbar-token
 */
export const swapHbarToToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { toTokenAddress, hbarAmount } = req.body as {
      toTokenAddress: string;
      hbarAmount: number;
    };

    if (!toTokenAddress || !hbarAmount || hbarAmount <= 0) {
      res.status(400).json({
        success: false,
        message: "toTokenAddress and positive hbarAmount are required",
      });
      return;
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.status(404).json({ success: false, message: "Wallet not found" });
      return;
    }

    const evmAddress = await getEvmAddressFromAccountId(wallet.accountId);

    // Calculate output via exchange service
    const { exchangeService } = await import("../services/exchange.service");
    const calc = await exchangeService.calculateSwapOutput(
      "HBAR",
      toTokenAddress,
      Number(hbarAmount)
    );

    // Parse target token decimals (use 18 default)
    const decimalsTo = 18;
    const toAmountSmallest = ethers.parseUnits(
      calc.output.toFixed(decimalsTo),
      decimalsTo
    );

    // Validate admin credentials
    if (!process.env.ADMIN_ACCOUNT_ID || !process.env.ADMIN_PRIVATE_KEY) {
      res.status(500).json({
        success: false,
        message:
          "Server misconfiguration: ADMIN_ACCOUNT_ID/ADMIN_PRIVATE_KEY not set",
      });
      return;
    }

    // Execute transferToUser via Hedera SDK (admin)
    const client = Client.forTestnet();
    const adminAccountId = AccountId.fromString(process.env.ADMIN_ACCOUNT_ID);
    const adminPrivateKey = PrivateKey.fromStringECDSA(
      process.env.ADMIN_PRIVATE_KEY
    );
    client.setOperator(adminAccountId, adminPrivateKey);

    const exchangeAddress =
      process.env.EXCHANGE_CONTRACT ||
      "0x1938C3345f2B6B2Fa3538713DB50f80ebA3a61d5";
    const exchangeContractId = evmAddressToContractId(exchangeAddress);

    const iface = new ethers.Interface([
      "function transferToUser(address token, address to, uint256 amount)",
    ]);
    const callData = iface.encodeFunctionData("transferToUser", [
      toTokenAddress,
      evmAddress,
      toAmountSmallest,
    ]);

    const tx = new ContractExecuteTransaction()
      .setContractId(exchangeContractId)
      .setGas(800000)
      .setFunctionParameters(Buffer.from(callData.slice(2), "hex"));

    const txResp = await tx.execute(client);
    const receipt = await txResp.getReceipt(client);
    client.close();

    // Log activity
    try {
      await activityService.createActivity({
        userId,
        activityType: "swap",
        amount: calc.output.toString(),
        fromToken: "HBAR",
        toToken: toTokenAddress,
        transactionHash: txResp.transactionId.toString(),
        status: receipt.status.toString() === "SUCCESS" ? "success" : "failed",
        metadata: {
          direction: "hbar_to_token",
          fromAmount: hbarAmount.toString(),
        },
      });
    } catch {}

    res.status(200).json({
      success: true,
      message: "HBAR → Token swap executed",
      data: {
        transactionHash: txResp.transactionId.toString(),
        amountOut: calc.output,
      },
    });
  } catch (error: any) {
    console.error("Error swapping HBAR to token:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to swap HBAR to token",
    });
  }
};

/**
 * Cash out HBAR → Naira (direct Paystack transfer)
 * POST /api/exchange/cashout-hbar
 * Body: { hbarAmount }
 */
export const cashoutHbarToNaira = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { hbarAmount } = req.body as { hbarAmount: number };
    if (!hbarAmount || hbarAmount <= 0) {
      res
        .status(400)
        .json({ success: false, message: "hbarAmount is required" });
      return;
    }

    // Get wallet and user
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.status(404).json({ success: false, message: "Wallet not found" });
      return;
    }

    const { User } = await import("../models/User");
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Bank account validation
    const { BankAccount } = await import("../models/BankAccount");
    const bankAccount = await BankAccount.findOne({ userId: user._id });
    if (!bankAccount) {
      res.status(400).json({
        success: false,
        message: "No bank account found. Link a bank account to cash out.",
      });
      return;
    }

    // Compute NGN value using exchange service
    const { exchangeService } = await import("../services/exchange.service");
    const calc = await exchangeService.calculateSwapOutput(
      "HBAR",
      "NGN",
      Number(hbarAmount)
    );
    const naira = calc.output;
    const kobo = Math.round(naira * 100);

    const { paystackService } = await import("../services/paystack.service");

    // Ensure transfer recipient
    let recipientCode = bankAccount.recipientCode as string | undefined;
    if (!recipientCode) {
      // Normalize bank code for test mode
      let normalizedBankCode = bankAccount.bankCode;
      let normalizedAccountNumber = bankAccount.accountNumber;
      try {
        const banksResp = await paystackService.getBanks();
        if (
          (!normalizedBankCode || normalizedBankCode === "test-bank") &&
          banksResp.status &&
          Array.isArray(banksResp.data)
        ) {
          const gt = banksResp.data.find((b: any) =>
            (b.name || "").toLowerCase().includes("guaranty")
          );
          const first = banksResp.data[0];
          normalizedBankCode = (gt?.code || first?.code || "058").toString();
        }
      } catch {
        if (!normalizedBankCode || normalizedBankCode === "test-bank") {
          normalizedBankCode = "058";
        }
      }
      if (!/^\d{10}$/.test(normalizedAccountNumber || "")) {
        normalizedAccountNumber = "0000000000";
      }

      const recipient = await paystackService.createTransferRecipient(
        `${user.firstName} ${user.lastName}`,
        normalizedAccountNumber,
        normalizedBankCode
      );
      if (!recipient.status) {
        res.status(400).json({
          success: false,
          message: recipient.message || "Failed to create transfer recipient",
        });
        return;
      }
      recipientCode = recipient.data.recipient_code;
      bankAccount.recipientCode = recipientCode;
      await bankAccount.save();
    }

    // Initiate transfer
    const transfer = await paystackService.initiateTransfer(
      recipientCode as string,
      kobo,
      `Cashout: ${hbarAmount} HBAR`
    );
    if (!transfer.status) {
      res.status(400).json({
        success: false,
        message: transfer.message || "Failed to initiate transfer",
      });
      return;
    }

    // Log activity
    try {
      await activityService.createActivity({
        userId,
        activityType: "swap",
        amount: hbarAmount.toString(),
        fromToken: "HBAR",
        toToken: "NGN",
        transactionHash: transfer.data.transfer_code,
        status: "success",
        metadata: {
          direction: "hbar_to_naira",
          nairaAmount: naira.toString(),
          kobo,
        },
      });
    } catch {}

    res.status(200).json({
      success: true,
      message: "Cashout initiated",
      data: {
        transferCode: transfer.data.transfer_code,
        naira,
      },
    });
  } catch (error: any) {
    console.error("[cashout-hbar] error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Initiate Naira to Token payment
 * POST /api/exchange/initiate-payment
 */
export const initiateNairaToTokenPayment = async (
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

    const { tokenAddress, nairaAmount, exchangeType } = req.body;

    if (!nairaAmount || !exchangeType) {
      res.status(400).json({
        success: false,
        message: "nairaAmount and exchangeType are required",
      });
      return;
    }

    if (exchangeType === "naira_to_token" && !tokenAddress) {
      res.status(400).json({
        success: false,
        message: "tokenAddress is required for naira_to_token exchange",
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

    const evmAddress = await getEvmAddressFromAccountId(wallet.accountId);

    // Get user details
    const { User } = await import("../models/User");
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Initialize PayStack transaction
    const { paystackService } = await import("../services/paystack.service");
    const amountInKobo = Math.round(nairaAmount * 100);

    const metadata = {
      exchangeType,
      walletAddress: evmAddress,
      ...(tokenAddress && { tokenAddress }),
    };

    const paymentResult = await paystackService.initializeTransaction(
      user.email,
      amountInKobo,
      "NGN",
      metadata
    );

    if (paymentResult.status) {
      res.status(200).json({
        success: true,
        message: "Payment initialized successfully",
        data: {
          authorizationUrl: paymentResult.data.authorization_url,
          accessCode: paymentResult.data.access_code,
          reference: paymentResult.data.reference,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: paymentResult.message || "Failed to initialize payment",
      });
    }
  } catch (error: any) {
    console.error("Error initiating payment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate payment",
    });
  }
};

/**
 * Spend NGN balance directly for Naira → Token/HBAR (no Paystack)
 * POST /api/exchange/spend-naira
 * Body: { exchangeType: 'naira_to_token' | 'naira_to_hbar', nairaAmount: number, tokenAddress?: string }
 */
export const spendNairaForExchange = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { exchangeType, nairaAmount, tokenAddress } = req.body as {
      exchangeType: "naira_to_token" | "naira_to_hbar";
      nairaAmount: number;
      tokenAddress?: string;
    };

    if (!exchangeType || !nairaAmount || nairaAmount <= 0) {
      res.status(400).json({
        success: false,
        message: "exchangeType and positive nairaAmount are required",
      });
      return;
    }

    if (exchangeType === "naira_to_token" && !tokenAddress) {
      res.status(400).json({
        success: false,
        message: "tokenAddress is required for naira_to_token",
      });
      return;
    }

    // Get user's wallet and evm address
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.status(404).json({ success: false, message: "Wallet not found" });
      return;
    }
    const evmAddress = await getEvmAddressFromAccountId(wallet.accountId);

    // Get bank account and ensure sufficient balance
    const { BankAccount } = await import("../models/BankAccount");
    const bankAccount = await BankAccount.findOne({ userId });
    if (!bankAccount) {
      res.status(400).json({
        success: false,
        message: "No bank account found. Please create/fund your NGN balance.",
      });
      return;
    }

    if (bankAccount.balance < nairaAmount) {
      res.status(400).json({
        success: false,
        message: "Insufficient NGN balance",
        data: { available: bankAccount.balance },
      });
      return;
    }

    // Deduct immediately
    const prevBalance = bankAccount.balance;
    bankAccount.balance = Math.max(0, bankAccount.balance - nairaAmount);
    await bankAccount.save();

    const { exchangeService } = await import("../services/exchange.service");

    let success = false;
    let txId: string | undefined;
    if (exchangeType === "naira_to_token" && tokenAddress) {
      const result = await exchangeService.handleNairaToToken(
        evmAddress,
        userId,
        tokenAddress,
        nairaAmount,
        "manual-spend"
      );
      success = result.success;
      txId = result.txId;
    } else if (exchangeType === "naira_to_hbar") {
      const result = await exchangeService.handleNairaToHbar(
        evmAddress,
        userId,
        nairaAmount,
        "manual-spend"
      );
      success = result.success;
      txId = result.txId;
    }

    if (!success) {
      // Refund on failure
      bankAccount.balance = prevBalance;
      await bankAccount.save();
      res.status(500).json({
        success: false,
        message: "Swap failed; NGN refunded",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Swap executed using NGN balance",
      data: {
        debited: nairaAmount,
        newBalance: bankAccount.balance,
        transactionHash: txId,
      },
    });
  } catch (error: any) {
    console.error("Error spending NGN for exchange:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to spend NGN for exchange",
    });
  }
};
