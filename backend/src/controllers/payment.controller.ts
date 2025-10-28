import { Request, Response } from "express";
import { User } from "../models/User";
import { BankAccount } from "../models/BankAccount";
import { paystackService } from "../services/paystack.service";
import { Transaction } from "./webhook.controller";

/**
 * Initialize payment to fund account via card
 * POST /api/payment/initialize
 */
export const initializePayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { amount, currency = "NGN" } = req.body;

    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid amount",
      });
      return;
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check if user has a bank account
    const bankAccount = await BankAccount.findOne({ userId });
    if (!bankAccount) {
      res.status(400).json({
        success: false,
        message: "Please create a bank account first",
      });
      return;
    }

    // Initialize payment with Paystack
    const amountInKobo = Math.round(parseFloat(amount) * 100);

    const paymentResult = await paystackService.initializeTransaction(
      user.email,
      amountInKobo,
      currency,
      {
        userId: String(user._id),
        bankAccountId: String(bankAccount._id),
        type: "account_funding",
      }
    );

    if (!paymentResult.status || !paymentResult.data) {
      res.status(500).json({
        success: false,
        message: "Failed to initialize payment",
        error: paymentResult.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      data: {
        authorizationUrl: paymentResult.data.authorization_url,
        accessCode: paymentResult.data.access_code,
        reference: paymentResult.data.reference,
      },
    });
  } catch (error) {
    console.error("Initialize payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error initializing payment",
      error: (error as Error).message,
    });
  }
};

/**
 * Verify payment after user completes card payment
 * GET /api/payment/verify/:reference
 */
export const verifyPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { reference } = req.params;

    if (!reference) {
      res.status(400).json({
        success: false,
        message: "Payment reference is required",
      });
      return;
    }

    // Verify transaction with Paystack
    const verificationResult = await paystackService.verifyTransaction(
      reference
    );

    if (!verificationResult.status || !verificationResult.data) {
      res.status(400).json({
        success: false,
        message: "Payment verification failed",
        error: verificationResult.message,
      });
      return;
    }

    const paymentData = verificationResult.data;

    // Check if payment was successful
    if (paymentData.status !== "success") {
      res.status(400).json({
        success: false,
        message: "Payment was not successful",
        data: {
          status: paymentData.status,
          message: paymentData.gateway_response,
        },
      });
      return;
    }

    // Get bank account
    const bankAccount = await BankAccount.findOne({ userId });
    if (!bankAccount) {
      res.status(404).json({
        success: false,
        message: "Bank account not found",
      });
      return;
    }

    // Check if transaction already exists
    const existingTransaction = await Transaction.findOne({ reference });

    if (existingTransaction) {
      // Transaction already processed
      res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: {
          reference: paymentData.reference,
          amount: existingTransaction.amount,
          currency: existingTransaction.currency,
          status: existingTransaction.status,
          paidAt: existingTransaction.paidAt,
          newBalance: bankAccount.balance,
          channel: existingTransaction.channel,
        },
      });
      return;
    }

    // Update bank account balance
    const amountInNaira = paymentData.amount / 100;
    bankAccount.balance += amountInNaira;
    await bankAccount.save();

    // Save transaction to database
    await Transaction.create({
      userId: bankAccount.userId,
      bankAccountId: bankAccount._id,
      reference: paymentData.reference,
      amount: amountInNaira,
      currency: paymentData.currency,
      status: paymentData.status,
      channel: paymentData.channel,
      paidAt: new Date(paymentData.paid_at),
      metadata: paymentData.metadata || {},
    });

    console.log(
      `✅ Card payment verified and saved: ${reference} - ₦${amountInNaira}`
    );

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        reference: paymentData.reference,
        amount: amountInNaira,
        currency: paymentData.currency,
        status: paymentData.status,
        paidAt: paymentData.paid_at,
        newBalance: bankAccount.balance,
        channel: paymentData.channel,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: (error as Error).message,
    });
  }
};

/**
 * Get payment history
 * GET /api/payment/history
 */
export const getPaymentHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20 } = req.query;

    // Get user's email
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Fetch transactions from Paystack
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const transactionsResult = await paystackService.listTransactions(
      user.email,
      pageNum,
      limitNum
    );

    if (!transactionsResult.status) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment history",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: transactionsResult.data,
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment history",
      error: (error as Error).message,
    });
  }
};
