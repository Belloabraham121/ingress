import mongoose, { Schema, Document } from "mongoose";

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  accountId: string;
  evmAddress: string;
  encryptedPrivateKey: string;
  iv: string;
  authTag: string;
  isActivated: boolean;
  balance: number;
  trackedWallets?: string[];
  copyTrade?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    accountId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    evmAddress: {
      type: String,
      required: true,
    },
    encryptedPrivateKey: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    authTag: {
      type: String,
      required: true,
    },
    isActivated: {
      type: Boolean,
      default: false,
    },
    balance: {
      type: Number,
      default: 0,
    },
    trackedWallets: {
      type: [String],
      default: [],
    },
    copyTrade: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);

