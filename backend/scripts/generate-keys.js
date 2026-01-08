/**
 * Script to generate secure keys for wallet generation
 * Run: node scripts/generate-keys.js
 */

const crypto = require("crypto");
const bip39 = require("bip39");

console.log("\n🔐 Generating Secure Keys for Ingress Backend\n");
console.log("=".repeat(60));

// Generate Master Seed (24-word mnemonic)
const masterSeed = bip39.generateMnemonic(256);
console.log("\n✅ MASTER_SEED (24-word mnemonic):");
console.log(masterSeed);
console.log("\n⚠️  IMPORTANT: Store this securely! Never commit to git!");

// Generate Encryption Secret Key (32 bytes = 64 hex characters)
const encryptionKey = "0x" + crypto.randomBytes(32).toString("hex");
console.log("\n✅ ENCRYPTION_SECRET_KEY (32 bytes):");
console.log(encryptionKey);
console.log("\n⚠️  IMPORTANT: Store this securely! Never commit to git!");

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(64).toString("hex");
console.log("\n✅ JWT_SECRET:");
console.log(jwtSecret);

console.log("\n" + "=".repeat(60));
console.log("\n📋 Copy these values to your .env file:\n");
console.log("MASTER_SEED=" + masterSeed);
console.log("ENCRYPTION_SECRET_KEY=" + encryptionKey);
console.log("JWT_SECRET=" + jwtSecret);
console.log("\n" + "=".repeat(60) + "\n");
