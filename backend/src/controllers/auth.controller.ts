import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Wallet } from "../models/Wallet";
import { walletGeneratorService } from "../services/walletGenerator.service";
import { blockchainService } from "../services/blockchain.service";
import { env } from "../config/env";

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
    const { fullName, email, password } = req.body;

    // Validate input
    if (!fullName || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Please provide full name, email, and password",
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
      fullName,
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
          fullName: user.fullName,
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
          fullName: user.fullName,
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
          fullName: user.fullName,
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
