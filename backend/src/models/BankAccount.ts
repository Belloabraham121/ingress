import mongoose, { Schema, Document } from "mongoose";

export interface IBankAccount extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  bvn: string;
  firstName: string;
  lastName: string;
  phone: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  virtualAccountId: string; // Paystack's dedicated virtual account ID
  currency: string;
  isActive: boolean;
  balance: number; // Track total deposits
  createdAt: Date;
  updatedAt: Date;
}

const BankAccountSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    bvn: {
      type: String,
      required: true,
      minlength: 11,
      maxlength: 11,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
    },
    accountName: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    bankCode: {
      type: String,
      required: true,
    },
    virtualAccountId: {
      type: String,
      required: true,
      unique: true,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
BankAccountSchema.index({ userId: 1 });
BankAccountSchema.index({ accountNumber: 1 });
BankAccountSchema.index({ virtualAccountId: 1 });

export const BankAccount = mongoose.model<IBankAccount>(
  "BankAccount",
  BankAccountSchema
);
