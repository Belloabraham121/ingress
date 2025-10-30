import { Request, Response } from "express";
import { User } from "../models/User";
import { BankAccount } from "../models/BankAccount";
import { paystackService } from "../services/paystack.service";
import { Transaction } from "./webhook.controller";
import { activityService } from "../services/activity.service";
import { Wallet } from "../models/Wallet";
import mongoose from "mongoose";

/**
 * Create virtual bank account with BVN
 * POST /api/bank-account/create
 */
export const createBankAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { bvn, firstName, lastName, phone, preferredBank } = req.body;

    // Validate input
    if (!bvn || !firstName || !lastName || !phone) {
      res.status(400).json({
        success: false,
        message: "Please provide BVN, first name, last name, and phone number",
      });
      return;
    }

    // Validate BVN format (11 digits)
    if (!/^\d{11}$/.test(bvn)) {
      res.status(400).json({
        success: false,
        message: "Invalid BVN format. BVN must be 11 digits",
      });
      return;
    }

    // Validate phone format
    if (!/^(\+?234|0)[789]\d{9}$/.test(phone)) {
      res.status(400).json({
        success: false,
        message:
          "Invalid phone number format. Use Nigerian phone number format",
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

    // Check if user already has a bank account
    const existingAccount = await BankAccount.findOne({ userId });
    if (existingAccount) {
      res.status(400).json({
        success: false,
        message: "You already have a bank account",
        data: {
          accountNumber: existingAccount.accountNumber,
          accountName: existingAccount.accountName,
          bankName: existingAccount.bankName,
        },
      });
      return;
    }

    // Step 1: Validate BVN (Optional - Paystack requires BVN match subscription)
    console.log("Validating BVN...");
    // Uncomment if you have BVN validation subscription
    // const bvnValidation = await paystackService.validateBVN(bvn, firstName, lastName);
    // if (!bvnValidation.status) {
    //   res.status(400).json({
    //     success: false,
    //     message: "BVN validation failed. Please ensure your details are correct",
    //     error: bvnValidation.message,
    //   });
    //   return;
    // }

    // Step 2: Create customer on Paystack
    console.log("Creating Paystack customer...");
    const customerResult = await paystackService.createCustomer(
      user.email,
      firstName,
      lastName,
      phone
    );

    if (!customerResult.status || !customerResult.data) {
      res.status(500).json({
        success: false,
        message: "Failed to create customer on Paystack",
        error: customerResult.message,
      });
      return;
    }

    const customerCode = customerResult.data.customer_code;

    // Step 3: Create dedicated virtual account
    console.log("Creating dedicated virtual account...");

    // Use test-bank for testing, wema-bank for production
    const defaultBank = preferredBank || "test-bank"; // Use test-bank for testing

    console.log(`🏦 Using bank: ${defaultBank}`);

    const accountResult = await paystackService.createDedicatedAccount(
      customerCode,
      defaultBank,
      bvn
    );

    if (!accountResult.status || !accountResult.data) {
      res.status(500).json({
        success: false,
        message: "Failed to create dedicated virtual account",
        error: accountResult.message,
      });
      return;
    }

    // Step 4: Save bank account to database
    const bankAccount = await BankAccount.create({
      userId: user._id,
      email: user.email,
      bvn,
      firstName,
      lastName,
      phone,
      accountNumber: accountResult.data.account_number,
      accountName: accountResult.data.account_name,
      bankName: accountResult.data.bank.name,
      bankCode: accountResult.data.bank.slug,
      virtualAccountId: accountResult.data.id.toString(),
      currency: accountResult.data.currency,
      isActive: accountResult.data.active,
      balance: 0,
    });

    // Step 5: Update user with bank account reference and BVN
    user.bankAccountId = bankAccount._id as any;
    user.bvn = bvn;
    user.phone = phone;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Bank account created successfully",
      data: {
        accountNumber: bankAccount.accountNumber,
        accountName: bankAccount.accountName,
        bankName: bankAccount.bankName,
        currency: bankAccount.currency,
        isActive: bankAccount.isActive,
        instructions: "Transfer money to this account to fund your wallet",
      },
    });
  } catch (error) {
    console.error("Create bank account error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating bank account",
      error: (error as Error).message,
    });
  }
};

/**
 * Get user's bank account details
 * GET /api/bank-account/details
 */
export const getBankAccountDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const bankAccount = await BankAccount.findOne({ userId });

    if (!bankAccount) {
      res.status(404).json({
        success: false,
        message: "No bank account found. Please create one first",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        accountNumber: bankAccount.accountNumber,
        accountName: bankAccount.accountName,
        bankName: bankAccount.bankName,
        currency: bankAccount.currency,
        balance: bankAccount.balance,
        isActive: bankAccount.isActive,
        createdAt: bankAccount.createdAt,
      },
    });
  } catch (error) {
    console.error("Get bank account details error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bank account details",
      error: (error as Error).message,
    });
  }
};

/**
 * Get account balance
 * GET /api/bank-account/balance
 */
export const getAccountBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const bankAccount = await BankAccount.findOne({ userId });

    if (!bankAccount) {
      res.status(404).json({
        success: false,
        message: "No bank account found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        balance: bankAccount.balance,
        currency: bankAccount.currency,
      },
    });
  } catch (error) {
    console.error("Get account balance error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching account balance",
      error: (error as Error).message,
    });
  }
};

/**
 * Get available banks for virtual account
 * GET /api/bank-account/banks
 */
export const getAvailableBanks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const banksResult = await paystackService.getBanks();

    if (!banksResult.status) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch banks",
        error: banksResult.message,
      });
      return;
    }

    // Filter to show only banks that support virtual accounts
    // Note: Use "test-bank" for testing, production banks require approval from Paystack
    const virtualAccountBanks = [
      {
        name: "Test Bank (Testing Only)",
        code: "test-bank",
        slug: "test-bank",
        description: "Use this for testing with test API keys",
      },
      {
        name: "Wema Bank",
        code: "wema-bank",
        slug: "wema-bank",
        description: "Production only - requires Paystack approval",
      },
      {
        name: "Titan (Paystack)",
        code: "titan-paystack",
        slug: "titan-paystack",
        description: "Production only - requires Paystack approval",
      },
    ];

    res.status(200).json({
      success: true,
      data: virtualAccountBanks,
    });
  } catch (error) {
    console.error("Get banks error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching banks",
      error: (error as Error).message,
    });
  }
};

/**
 * Manually refresh balance from Paystack (for when webhooks aren't working)
 * POST /api/bank-account/refresh-balance
 */
export const refreshBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Get bank account
    const bankAccount = await BankAccount.findOne({ userId });
    if (!bankAccount) {
      res.status(404).json({
        success: false,
        message: "No bank account found",
      });
      return;
    }

    console.log(`🔄 Manually refreshing balance for ${user.email}...`);
    console.log(`📊 Current balance in DB: ₦${bankAccount.balance}`);

    // Fetch recent transactions from Paystack
    const transactionsResult = await paystackService.listTransactions(
      user.email,
      1,
      50
    );

    if (!transactionsResult.status || !transactionsResult.data) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch transactions from Paystack",
      });
      return;
    }

    const transactions = transactionsResult.data;
    console.log(`📦 Found ${transactions.length} transactions from Paystack`);
    let newBalance = 0;
    let newTransactions = 0;
    let savedTransactions = 0;

    // Calculate total from successful transactions and save to database
    for (const tx of transactions) {
      if (tx.status === "success") {
        const txAmount = tx.amount / 100;
        newBalance += txAmount; // Convert from kobo to naira
        newTransactions++;
        console.log(
          `  ✓ Transaction ${tx.reference}: ₦${txAmount} (${tx.channel})`
        );

        // Save transaction to database if it doesn't exist
        const existingTx = await Transaction.findOne({
          reference: tx.reference,
        });
        if (!existingTx) {
          await Transaction.create({
            userId: bankAccount.userId,
            bankAccountId: bankAccount._id,
            reference: tx.reference,
            amount: txAmount,
            currency: tx.currency,
            status: tx.status,
            channel: tx.channel,
            paidAt: new Date(tx.paid_at),
            metadata: tx.metadata || {},
          });
          savedTransactions++;
          console.log(`    → Saved to database`);
        } else {
          console.log(`    → Already in database`);
        }
      }
    }

    // Update bank account balance
    const oldBalance = bankAccount.balance;
    bankAccount.balance = newBalance;
    await bankAccount.save();

    console.log(`✅ Balance updated: ₦${oldBalance} → ₦${newBalance}`);
    console.log(`✅ Saved ${savedTransactions} new transactions to database`);

    res.status(200).json({
      success: true,
      message: "Balance refreshed successfully",
      data: {
        oldBalance,
        newBalance,
        difference: newBalance - oldBalance,
        transactionsFound: newTransactions,
        transactionsSaved: savedTransactions,
        currency: bankAccount.currency,
      },
    });
  } catch (error) {
    console.error("Refresh balance error:", error);
    res.status(500).json({
      success: false,
      message: "Error refreshing balance",
      error: (error as Error).message,
    });
  }
};

/**
 * Transfer NGN between users by Hedera Account ID (off-ledger)
 * POST /api/bank-account/transfer
 * Body: { toAccountId: string; amount: number }
 */
export const transferNaira = async (
  req: Request,
  res: Response
): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    const userId = (req as any).user.id;
    const { toAccountId, amount } = req.body as {
      toAccountId: string;
      amount: number;
    };

    if (!toAccountId || !amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: "toAccountId and positive amount are required",
      });
      return;
    }

    // Round to 2dp
    const nairaAmount = Math.round(Number(amount) * 100) / 100;

    // Fetch sender and recipient
    const senderAccount = await BankAccount.findOne({ userId });
    if (!senderAccount) {
      res
        .status(404)
        .json({ success: false, message: "Sender bank account not found" });
      return;
    }

    const recipientWallet = await Wallet.findOne({ accountId: toAccountId });
    if (!recipientWallet) {
      res.status(404).json({
        success: false,
        message: "Recipient wallet not found for accountId",
      });
      return;
    }
    const recipientAccount = await BankAccount.findOne({
      userId: recipientWallet.userId,
    });
    if (!recipientAccount) {
      res
        .status(404)
        .json({ success: false, message: "Recipient bank account not found" });
      return;
    }

    if ((senderAccount.balance || 0) < nairaAmount) {
      res
        .status(400)
        .json({ success: false, message: "Insufficient NGN balance" });
      return;
    }

    // Perform atomic transfer
    await session.withTransaction(async () => {
      const freshSender = await BankAccount.findById(senderAccount._id).session(
        session
      );
      const freshRecipient = await BankAccount.findById(
        recipientAccount._id
      ).session(session);
      if (!freshSender || !freshRecipient)
        throw new Error("Accounts not found");
      if ((freshSender.balance || 0) < nairaAmount)
        throw new Error("Insufficient NGN balance");

      const senderOld = freshSender.balance || 0;
      const recipientOld = freshRecipient.balance || 0;

      freshSender.balance = Math.round((senderOld - nairaAmount) * 100) / 100;
      freshRecipient.balance =
        Math.round((recipientOld + nairaAmount) * 100) / 100;

      await freshSender.save({ session });
      await freshRecipient.save({ session });

      // Record transactions (optional, for history)
      const referenceBase = `NGN_XFER_${Date.now()}`;
      await Transaction.create([
        {
          userId: freshSender.userId,
          bankAccountId: freshSender._id,
          reference: `${referenceBase}_DEBIT`,
          amount: nairaAmount,
          currency: freshSender.currency || "NGN",
          status: "success",
          channel: "internal_transfer",
          metadata: { direction: "debit", toAccountId },
        },
        {
          userId: freshRecipient.userId,
          bankAccountId: freshRecipient._id,
          reference: `${referenceBase}_CREDIT`,
          amount: nairaAmount,
          currency: freshRecipient.currency || "NGN",
          status: "success",
          channel: "internal_transfer",
          metadata: { direction: "credit", fromUserId: userId },
        },
      ]);

      // Create activities for sender and recipient
      await activityService.createActivity({
        userId: freshSender.userId.toString(),
        activityType: "transfer" as any,
        amount: nairaAmount.toString(),
        fromToken: "NGN",
        toToken: "NGN",
        transactionHash: referenceBase,
        status: "success",
        metadata: { direction: "naira_transfer_debit", toAccountId },
      });
      await activityService.createActivity({
        userId: freshRecipient.userId.toString(),
        activityType: "transfer" as any,
        amount: nairaAmount.toString(),
        fromToken: "NGN",
        toToken: "NGN",
        transactionHash: referenceBase,
        status: "success",
        metadata: { direction: "naira_transfer_credit", fromUserId: userId },
      });
    });

    res.status(200).json({ success: true, message: "Transfer completed" });
  } catch (error: any) {
    console.error("Transfer NGN error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Transfer failed" });
  } finally {
    session.endSession();
  }
};
