import { Request, Response } from "express";
import { Wallet } from "../models/Wallet";
import { User } from "../models/User";

/**
 * @route   GET /api/wallet/resolve/:accountId
 * @desc    Resolve a Hedera account ID to the user's display name
 * @access  Private
 */
export const resolveAccountId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { accountId } = req.params;

    if (!accountId || typeof accountId !== "string") {
      res
        .status(400)
        .json({ success: false, message: "accountId is required" });
      return;
    }

    // Find wallet by Hedera account ID
    const wallet = await Wallet.findOne({ accountId }).lean();
    if (!wallet) {
      res.status(404).json({ success: false, message: "Account not found" });
      return;
    }

    // Get user name
    const user = await User.findById(wallet.userId)
      .select("firstName lastName")
      .lean();
    const displayName = user
      ? `${user.firstName} ${user.lastName}`.trim()
      : undefined;

    res.json({
      success: true,
      data: {
        accountId: wallet.accountId,
        userId: wallet.userId,
        name: displayName,
      },
    });
  } catch (error: any) {
    console.error("resolveAccountId error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
