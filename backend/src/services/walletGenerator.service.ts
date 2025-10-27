import { ethers } from "ethers";
import * as bip39 from "bip39";
import * as crypto from "crypto";
import { env } from "../config/env";

export class WalletGeneratorService {
  private masterSeed: string;
  private encryptionSecretKey: string;

  constructor() {
    this.masterSeed = env.MASTER_SEED;
    this.encryptionSecretKey = env.ENCRYPTION_SECRET_KEY;

    if (!this.masterSeed || !this.encryptionSecretKey) {
      throw new Error(
        "MASTER_SEED and ENCRYPTION_SECRET_KEY must be set in environment variables"
      );
    }
  }

  /**
   * Generate deterministic wallet based on email address
   */
  generateDeterministicWallet(email: string): ethers.HDNodeWallet {
    try {
      if (!bip39.validateMnemonic(this.masterSeed)) {
        throw new Error("Invalid master seed mnemonic");
      }

      const seed = bip39.mnemonicToSeedSync(this.masterSeed);
      const masterNode = ethers.HDNodeWallet.fromSeed(seed);

      // Create deterministic index from email
      const emailHash = ethers.keccak256(
        ethers.toUtf8Bytes(email.toLowerCase())
      );
      const index = BigInt(emailHash) % BigInt(2147483647);

      const derivationPath = `m/44'/60'/0'/0/${index.toString()}`;
      const wallet = masterNode.derivePath(derivationPath);

      console.log(`Generated wallet for ${email} at path: ${derivationPath}`);
      return wallet;
    } catch (error) {
      console.error("Error generating deterministic wallet:", error);
      throw new Error("Failed to generate wallet");
    }
  }

  /**
   * Encrypt private key using AES-256-GCM
   */
  encryptPrivateKey(privateKey: string): {
    encryptedData: string;
    iv: string;
    authTag: string;
  } {
    try {
      const algorithm = "aes-256-gcm";
      const secretKey = Buffer.from(
        this.encryptionSecretKey.replace("0x", ""),
        "hex"
      );

      if (secretKey.length !== 32) {
        throw new Error(
          "Encryption secret key must be 32 bytes (64 hex characters)"
        );
      }

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
      cipher.setAAD(Buffer.from("wallet-encryption", "utf8"));

      let encrypted = cipher.update(privateKey, "utf8", "hex");
      encrypted += cipher.final("hex");
      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
      };
    } catch (error) {
      console.error("Error encrypting private key:", error);
      throw new Error("Failed to encrypt private key");
    }
  }

  /**
   * Decrypt private key using AES-256-GCM
   */
  decryptPrivateKey(
    encryptedData: string,
    iv: string,
    authTag: string
  ): string {
    try {
      const algorithm = "aes-256-gcm";
      const secretKey = Buffer.from(
        this.encryptionSecretKey.replace("0x", ""),
        "hex"
      );
      const ivBuffer = Buffer.from(iv, "hex");

      const decipher = crypto.createDecipheriv(algorithm, secretKey, ivBuffer);
      decipher.setAAD(Buffer.from("wallet-encryption", "utf8"));
      decipher.setAuthTag(Buffer.from(authTag, "hex"));

      let decrypted = decipher.update(encryptedData, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      console.error("Error decrypting private key:", error);
      throw new Error("Failed to decrypt private key");
    }
  }
}

export const walletGeneratorService = new WalletGeneratorService();
