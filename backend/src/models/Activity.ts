import mongoose, { Schema, Document } from "mongoose";

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  activityType:
    | "swap"
    | "invest"
    | "stake"
    | "withdraw_vault"
    | "withdraw_stake";
  amount: string;
  tokenSymbol?: string;
  fromToken?: string;
  toToken?: string;
  vaultName?: string;
  vaultAddress?: string;
  poolName?: string;
  poolId?: number;
  stakingPoolAddress?: string;
  transactionHash: string;
  status: "success" | "failed" | "pending";
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    activityType: {
      type: String,
      enum: ["swap", "invest", "stake", "withdraw_vault", "withdraw_stake"],
      required: [true, "Activity type is required"],
      index: true,
    },
    amount: {
      type: String,
      required: [true, "Amount is required"],
    },
    tokenSymbol: {
      type: String,
      trim: true,
    },
    // For swap transactions
    fromToken: {
      type: String,
      trim: true,
    },
    toToken: {
      type: String,
      trim: true,
    },
    // For vault/invest transactions
    vaultName: {
      type: String,
      trim: true,
    },
    vaultAddress: {
      type: String,
      trim: true,
    },
    // For staking transactions
    poolName: {
      type: String,
      trim: true,
    },
    poolId: {
      type: Number,
    },
    stakingPoolAddress: {
      type: String,
      trim: true,
    },
    transactionHash: {
      type: String,
      required: [true, "Transaction hash is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying of user activities sorted by date
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ userId: 1, activityType: 1, createdAt: -1 });

export const Activity = mongoose.model<IActivity>("Activity", ActivitySchema);
