import { Request, Response } from "express";
import crypto from "crypto";
import { BankAccount } from "../models/BankAccount";
import { env } from "../config/env";

/**
 * Transaction model to store payment history
 */
import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  bankAccountId: mongoose.Types.ObjectId;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  channel: string;
  paidAt?: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bankAccountId: {
      type: Schema.Types.ObjectId,
      ref: "BankAccount",
      required: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    channel: {
      type: String,
      default: "dedicated_nuban",
    },
    paidAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);

/**
 * Verify Paystack webhook signature
 */
const verifyPaystackSignature = (req: Request): boolean => {
  const hash = crypto
    .createHmac("sha512", env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  return hash === req.headers["x-paystack-signature"];
};

/**
 * Handle Paystack webhook events
 * POST /api/webhook/paystack
 */
export const handlePaystackWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Verify webhook signature
    const isValid = verifyPaystackSignature(req);

    if (!isValid) {
      console.error("Invalid webhook signature");
      res.status(401).json({
        success: false,
        message: "Invalid signature",
      });
      return;
    }

    const { event, data } = req.body;

    console.log(`📩 Webhook received: ${event}`);
    console.log("Webhook data:", JSON.stringify(data, null, 2));

    // Handle different webhook events
    switch (event) {
      case "charge.success":
        await handleChargeSuccess(data);
        break;

      case "transfer.success":
        await handleTransferSuccess(data);
        break;

      case "transfer.failed":
        await handleTransferFailed(data);
        break;

      case "dedicatedaccount.assign.success":
        console.log("Dedicated account assigned successfully");
        break;

      case "dedicatedaccount.assign.failed":
        console.error("Dedicated account assignment failed:", data);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Still return 200 to prevent Paystack from retrying
    res.status(200).json({
      success: true,
      message: "Webhook received",
    });
  }
};

/**
 * Handle successful charge (payment received)
 */
async function handleChargeSuccess(data: any): Promise<void> {
  try {
    const {
      reference,
      amount,
      currency,
      customer,
      channel,
      paid_at,
      metadata,
    } = data;

    console.log(`💰 Payment received: ${amount / 100} ${currency}`);

    // Find bank account by customer email or account number
    let bankAccount = await BankAccount.findOne({
      email: customer.email,
    });

    // If dedicated account payment, find by account number
    if (metadata?.account_number) {
      bankAccount = await BankAccount.findOne({
        accountNumber: metadata.account_number,
      });
    }

    if (!bankAccount) {
      console.error("Bank account not found for customer:", customer.email);
      return;
    }

    // Check if transaction already exists
    const existingTransaction = await Transaction.findOne({ reference });
    if (existingTransaction) {
      console.log("Transaction already processed:", reference);
      return;
    }

    // Create transaction record
    const transaction = await Transaction.create({
      userId: bankAccount.userId,
      bankAccountId: bankAccount._id,
      reference,
      amount: amount / 100, // Convert from kobo to naira
      currency,
      status: "success",
      channel,
      paidAt: new Date(paid_at),
      metadata,
    });

    // Check if this is an exchange payment (Naira → Token/HBAR)
    if (metadata?.exchangeType && metadata?.walletAddress) {
      console.log("📊 Exchange payment detected!");
      const { exchangeService } = await import("../services/exchange.service");

      const nairaAmount = amount / 100; // Convert from kobo to naira
      const { exchangeType, tokenAddress, walletAddress } = metadata;

      if (exchangeType === "naira_to_token" && tokenAddress) {
        // Naira → Token
        const result = await exchangeService.handleNairaToToken(
          walletAddress,
          bankAccount.userId.toString(),
          tokenAddress,
          nairaAmount,
          reference
        );

        if (result.success) {
          console.log("✅ Token sent to user successfully!");
        } else {
          console.error("❌ Failed to send token to user");
        }
      } else if (exchangeType === "naira_to_hbar") {
        // Naira → HBAR
        const result = await exchangeService.handleNairaToHbar(
          walletAddress,
          bankAccount.userId.toString(),
          nairaAmount,
          reference
        );

        if (result.success) {
          console.log("✅ HBAR sent to user successfully!");
        } else {
          console.error("❌ Failed to send HBAR to user");
        }
      }
    } else {
      // Regular deposit to bank account balance
      bankAccount.balance += amount / 100;
      await bankAccount.save();

      console.log(
        `✅ Transaction saved and balance updated for account: ${bankAccount.accountNumber}`
      );
      console.log(`New balance: ${bankAccount.balance} ${currency}`);
    }
  } catch (error) {
    console.error("Error handling charge success:", error);
  }
}

/**
 * Handle successful transfer (money sent out)
 */
async function handleTransferSuccess(data: any): Promise<void> {
  try {
    console.log("Transfer successful:", data);
    // Implement transfer logic if needed
  } catch (error) {
    console.error("Error handling transfer success:", error);
  }
}

/**
 * Handle failed transfer
 */
async function handleTransferFailed(data: any): Promise<void> {
  try {
    console.log("Transfer failed:", data);
    // Implement failed transfer logic if needed
  } catch (error) {
    console.error("Error handling transfer failed:", error);
  }
}

/**
 * Get transaction history
 * GET /api/webhook/transactions
 */
export const getTransactionHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { limit = 50, page = 1 } = req.query;

    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip)
      .lean();

    const total = await Transaction.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Get transaction history error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching transaction history",
      error: (error as Error).message,
    });
  }
};
