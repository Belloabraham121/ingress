import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Wallet } from "../models/Wallet";
import { walletGeneratorService } from "../services/walletGenerator.service";
import { blockchainService } from "../services/blockchain.service";
import { env } from "../config/env";
import { ethers } from "ethers";
import {
  ContractExecuteTransaction,
  AccountId,
  PrivateKey,
  ContractId,
} from "@hashgraph/sdk";
import { activityService } from "../services/activity.service";

function evmAddressToContractId(evmAddress: string): ContractId {
  const cleanAddress = evmAddress.startsWith("0x")
    ? evmAddress.slice(2)
    : evmAddress;
  return ContractId.fromEvmAddress(0, 0, cleanAddress);
}

async function resolveRecipientToEvm(to: string): Promise<string> {
  if (/^\d+\.\d+\.\d+$/.test(to)) {
    // Hedera account ID → fetch EVM via mirror node
    const resp = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts/${to}`
    );
    if (!resp.ok)
      throw new Error("Failed to resolve account ID to EVM address");
    const data: any = await resp.json();
    const evm = (data as any).evm_address
      ? (data as any).evm_address.startsWith("0x")
        ? (data as any).evm_address
        : `0x${(data as any).evm_address}`
      : null;
    if (!evm) throw new Error("No EVM address for provided account ID");
    return evm;
  }
  // assume EVM address
  return to;
}

/**
 * Generate JWT token
 */
const generateToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    env.JWT_SECRET as string,
    {
      expiresIn: env.JWT_EXPIRES_IN as string,
    } as jwt.SignOptions
  );
};

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Please provide first name, last name, email, and password",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
      return;
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
    });

    // Generate deterministic wallet
    console.log(`Generating wallet for user: ${email}`);
    const wallet = walletGeneratorService.generateDeterministicWallet(email);

    // Encrypt private key
    const { encryptedData, iv, authTag } =
      walletGeneratorService.encryptPrivateKey(wallet.privateKey);

    // Create Hedera account
    console.log("Creating Hedera account...");
    const { accountId, evmAddress } = await blockchainService.createAccount(
      wallet.privateKey
    );

    // Save wallet to database
    const walletDoc = await Wallet.create({
      userId: user._id,
      email: email.toLowerCase(),
      accountId,
      evmAddress,
      encryptedPrivateKey: encryptedData,
      iv,
      authTag,
      isActivated: false,
      balance: 0,
    });

    // Update user with wallet reference
    user.walletId = walletDoc._id as any;
    await user.save();

    // Generate token
    const token = generateToken((user._id as any).toString());

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        wallet: {
          accountId: walletDoc.accountId,
          evmAddress: walletDoc.evmAddress,
          isActivated: walletDoc.isActivated,
          balance: walletDoc.balance,
          activationRequired: env.ACTIVATION_AMOUNT,
        },
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: (error as Error).message,
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
      return;
    }

    // Find user (include password for comparison)
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    // Get wallet information
    const wallet = await Wallet.findOne({ userId: user._id });

    if (!wallet) {
      res.status(404).json({
        success: false,
        message: "Wallet not found for this user",
      });
      return;
    }

    // Update wallet balance
    try {
      const balance = await blockchainService.getHBARBalance(wallet.accountId);
      wallet.balance = parseFloat(balance);

      // Check if wallet is activated (has minimum balance)
      const minBalance = parseFloat(env.ACTIVATION_AMOUNT);
      if (wallet.balance >= minBalance && !wallet.isActivated) {
        wallet.isActivated = true;
      }

      await wallet.save();
    } catch (error) {
      console.error("Error updating wallet balance:", error);
    }

    // Generate token
    const token = generateToken((user._id as any).toString());

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        wallet: {
          accountId: wallet.accountId,
          evmAddress: wallet.evmAddress,
          isActivated: wallet.isActivated,
          balance: wallet.balance,
          activationRequired: wallet.isActivated ? 0 : env.ACTIVATION_AMOUNT,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: (error as Error).message,
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const wallet = await Wallet.findOne({ userId: user._id });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        wallet: wallet
          ? {
              accountId: wallet.accountId,
              evmAddress: wallet.evmAddress,
              isActivated: wallet.isActivated,
              balance: wallet.balance,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
      error: (error as Error).message,
    });
  }
};

/**
 * Fund wallet (activate wallet)
 * POST /api/auth/fund-wallet
 */
export const fundWallet = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
      return;
    }

    if (wallet.isActivated) {
      res.status(400).json({
        success: false,
        message: "Wallet is already activated",
      });
      return;
    }

    // Fund the wallet
    const fundResult = await blockchainService.fundWallet(wallet.accountId);

    if (fundResult.success) {
      // Update wallet status
      wallet.isActivated = true;
      wallet.balance = parseFloat(env.ACTIVATION_AMOUNT);
      await wallet.save();

      res.status(200).json({
        success: true,
        message: `Wallet funded successfully with ${env.ACTIVATION_AMOUNT} HBAR`,
        data: {
          txId: fundResult.txId,
          wallet: {
            accountId: wallet.accountId,
            isActivated: wallet.isActivated,
            balance: wallet.balance,
          },
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: fundResult.message,
      });
    }
  } catch (error) {
    console.error("Fund wallet error:", error);
    res.status(500).json({
      success: false,
      message: "Error funding wallet",
      error: (error as Error).message,
    });
  }
};

/**
 * Send HBAR to user's wallet
 * POST /api/auth/send-hbar
 */
export const sendHBAR = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { amount } = req.body;

    // Validate input
    if (!amount) {
      res.status(400).json({
        success: false,
        message: "Please provide amount",
      });
      return;
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
      return;
    }

    // Send HBAR to the wallet
    const sendResult = await blockchainService.sendHBAR(
      wallet.accountId,
      amount
    );

    if (sendResult.success) {
      // Update wallet balance
      const newBalance = await blockchainService.getHBARBalance(
        wallet.accountId
      );
      wallet.balance = parseFloat(newBalance);

      // Activate wallet if not activated and has sufficient balance
      if (
        !wallet.isActivated &&
        wallet.balance >= parseFloat(env.ACTIVATION_AMOUNT)
      ) {
        wallet.isActivated = true;
      }

      await wallet.save();

      res.status(200).json({
        success: true,
        message: `Successfully sent ${amount} HBAR to your wallet`,
        data: {
          txId: sendResult.txId,
          wallet: {
            accountId: wallet.accountId,
            evmAddress: wallet.evmAddress,
            balance: wallet.balance,
            isActivated: wallet.isActivated,
          },
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: sendResult.message,
      });
    }
  } catch (error) {
    console.error("Send HBAR error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending HBAR",
      error: (error as Error).message,
    });
  }
};

/**
 * Transfer HBAR to another account
 * POST /api/auth/transfer-hbar
 */
export const transferHBAR = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { toAccountId, amount } = req.body;

    // Validate input
    if (!toAccountId || !amount) {
      res.status(400).json({
        success: false,
        message: "Please provide recipient account ID and amount",
      });
      return;
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
      return;
    }

    // Decrypt private key
    const { walletGeneratorService } = await import(
      "../services/walletGenerator.service"
    );
    const privateKey = walletGeneratorService.decryptPrivateKey(
      wallet.encryptedPrivateKey,
      wallet.iv,
      wallet.authTag
    );

    // Transfer HBAR
    const transferResult = await blockchainService.transferHBAR(
      wallet.accountId,
      privateKey,
      toAccountId,
      amount
    );

    if (transferResult.success) {
      // Update wallet balance
      wallet.balance = parseFloat(transferResult.balance || "0");
      await wallet.save();

      res.status(200).json({
        success: true,
        message: `Successfully transferred ${amount} HBAR to ${toAccountId}`,
        data: {
          txId: transferResult.txId,
          from: wallet.accountId,
          to: toAccountId,
          amount: amount,
          newBalance: wallet.balance,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: transferResult.message,
        balance: transferResult.balance,
      });
    }
  } catch (error) {
    console.error("Transfer HBAR error:", error);
    res.status(500).json({
      success: false,
      message: "Error transferring HBAR",
      error: (error as Error).message,
    });
  }
};

/**
 * Get wallet balance
 * GET /api/auth/wallet-balance
 */
export const getWalletBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
      return;
    }

    // Get live balance from Hedera
    const balance = await blockchainService.getHBARBalance(wallet.accountId);

    // Update stored balance
    wallet.balance = parseFloat(balance);
    await wallet.save();

    res.status(200).json({
      success: true,
      data: {
        accountId: wallet.accountId,
        evmAddress: wallet.evmAddress,
        balance: wallet.balance,
        balanceString: balance,
        isActivated: wallet.isActivated,
      },
    });
  } catch (error) {
    console.error("Get wallet balance error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching wallet balance",
      error: (error as Error).message,
    });
  }
};

/**
 * Logout (stateless): client should delete stored JWT
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // If you later adopt cookies, you could clear them here
    // For JWT-in-header, instruct client to remove token
    res.status(200).json({ success: true, message: "Logged out" });
  } catch (error) {
    res.status(200).json({ success: true, message: "Logged out" });
  }
};

/**
 * Transfer ERC20 token to an account ID or EVM address
 * POST /api/auth/transfer-token
 */
export const transferToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const {
      tokenAddress,
      to,
      amount,
      decimals = 18,
    } = req.body as {
      tokenAddress: string;
      to: string;
      amount: string;
      decimals?: number;
    };

    if (!tokenAddress || !to || !amount) {
      res.status(400).json({
        success: false,
        message: "tokenAddress, to and amount are required",
      });
      return;
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      res.status(404).json({ success: false, message: "Wallet not found" });
      return;
    }

    const recipientEvm = await resolveRecipientToEvm(to);

    // Decrypt private key
    const privateKeyHex = walletGeneratorService.decryptPrivateKey(
      wallet.encryptedPrivateKey,
      wallet.iv,
      wallet.authTag
    );

    // Initialize Hedera client with user's account
    const accountId = AccountId.fromString(wallet.accountId);
    const privateKey = PrivateKey.fromStringECDSA(privateKeyHex);
    const client = (await import("@hashgraph/sdk")).Client.forTestnet();
    client.setOperator(accountId, privateKey);

    // Encode ERC20 transfer(to, amount)
    const iface = new ethers.Interface([
      "function transfer(address to, uint256 amount) returns (bool)",
    ]);
    const amountSmallest = ethers.parseUnits(amount, Number(decimals));
    const data = iface.encodeFunctionData("transfer", [
      recipientEvm,
      amountSmallest,
    ]);

    // Execute on token contract
    const tokenContractId = evmAddressToContractId(tokenAddress);
    const tx = new ContractExecuteTransaction()
      .setContractId(tokenContractId)
      .setGas(500000)
      .setFunctionParameters(Buffer.from(data.slice(2), "hex"));

    const resp = await tx.execute(client);
    const receipt = await resp.getReceipt(client);
    const status = receipt.status.toString();
    client.close();

    if (status !== "SUCCESS") {
      res.status(400).json({
        success: false,
        message: `Token transfer failed: ${status}`,
      });
      return;
    }

    // Log activity for token transfer
    try {
      await activityService.createActivity({
        userId,
        activityType: "transfer" as any,
        amount: amount.toString(),
        fromToken: tokenAddress,
        toToken: tokenAddress,
        transactionHash: resp.transactionId.toString(),
        status: "success",
        metadata: {
          direction: "token_transfer",
          to: recipientEvm,
          decimals,
        },
      });
    } catch {}

    res.status(200).json({
      success: true,
      message: "Token transferred successfully",
      data: {
        transactionHash: resp.transactionId.toString(),
        to: recipientEvm,
        amount,
        tokenAddress,
      },
    });
  } catch (error: any) {
    console.error("Transfer token error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error transferring token",
    });
  }
};
