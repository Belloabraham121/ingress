import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || "3000",
  MONGO_URI:
    process.env.MONGO_URI ||
    "mongodb+srv://iteoluwakisibello_db_user:WgvcjU9TyjCVM1dz@cluster1.gzkfjro.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1",
  JWT_SECRET:
    process.env.JWT_SECRET || "your-secret-jwt-key-change-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Hedera Configuration
  HEDERA_OPERATOR_ID: process.env.HEDERA_OPERATOR_ID || "",
  HEDERA_OPERATOR_KEY: process.env.HEDERA_OPERATOR_KEY || "",

  // Wallet Generation
  MASTER_SEED: process.env.MASTER_SEED || "",
  ENCRYPTION_SECRET_KEY: process.env.ENCRYPTION_SECRET_KEY || "",

  // Wallet Activation
  ACTIVATION_AMOUNT: process.env.ACTIVATION_AMOUNT || "5", // HBAR amount needed to activate wallet

  // Paystack Configuration
  PAYSTACK_SECRET_KEY:
    process.env.PAYSTACK_SECRET_KEY ||
    "sk_test_a57d76515f3ea504312f06d792d86bf3a69a3b81",
  PAYSTACK_PUBLIC_KEY:
    process.env.PAYSTACK_PUBLIC_KEY ||
    "pk_test_a7cb416c143b0e27c9e355e77ef1cda91f356b2e",
};
