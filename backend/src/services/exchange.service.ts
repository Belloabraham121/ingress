import { ethers } from "ethers";
import {
  Client,
  PrivateKey,
  AccountId,
  ContractExecuteTransaction,
  ContractId,
} from "@hashgraph/sdk";
import axios from "axios";
import { paystackService } from "./paystack.service";
import { priceOracleService } from "./priceOracle.service";
import { Wallet } from "../models/Wallet";
import { User } from "../models/User";
import { BankAccount } from "../models/BankAccount";
import { activityService } from "./activity.service";

const HEDERA_MIRROR_NODE = "https://testnet.mirrornode.hedera.com/api/v1";

// Exchange Contract Address
const EXCHANGE_CONTRACT = "0x1938C3345f2B6B2Fa3538713DB50f80ebA3a61d5";

// Token Addresses
const USDC_TOKEN = "0x125D3f690f281659Dd7708D21688BC83Ee534aE6";
const USDT_TOKEN = "0xd4E61131Ed9C3dd610727655aE8254B286deE95c";
const DAI_TOKEN = "0x3814F5Cf6c4Aa63EdDF8A79c82346a163c7E7C53";

// Token decimals (all stables use 18 decimals in our utils/contracts)
const TOKEN_DECIMALS: Record<string, number> = {
  [USDC_TOKEN.toLowerCase()]: 18,
  [USDT_TOKEN.toLowerCase()]: 18,
  [DAI_TOKEN.toLowerCase()]: 18,
  hbar: 8,
};

// Token symbol mapping
const TOKEN_SYMBOLS: Record<string, string> = {
  [USDC_TOKEN.toLowerCase()]: "USDC",
  [USDT_TOKEN.toLowerCase()]: "USDT",
  [DAI_TOKEN.toLowerCase()]: "DAI",
};

/**
 * Convert EVM address to Hedera ContractId
 */
function evmAddressToContractId(evmAddress: string): ContractId {
  const cleanAddress = evmAddress.startsWith("0x")
    ? evmAddress.slice(2)
    : evmAddress;
  return ContractId.fromEvmAddress(0, 0, cleanAddress);
}

/**
 * Exchange service for handling Token ↔ Naira swaps
 */
class ExchangeService {
  private isListening: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastProcessedTimestamp: string = "";

  // Admin wallet for sending tokens (should be stored securely in env)
  private adminAccountId: string;
  private adminPrivateKey: string;

  // Event signatures (keccak256 hashes)
  private readonly TOKEN_DEPOSITED_TOPIC =
    "0xf1444b5cad7ce70cb018d1b8edc8618fe303f3c7f034d8d572a6e27facbf2bef";
  private readonly HBAR_DEPOSITED_TOPIC =
    "0x768b80b0d4cfe83449db42d5373dd4e52dd5d2b35b3fb1c855b7dba6eff47cf0";

  constructor() {
    // Get admin credentials from environment
    this.adminAccountId = process.env.ADMIN_ACCOUNT_ID || "";
    this.adminPrivateKey = process.env.ADMIN_PRIVATE_KEY || "";

    if (!this.adminAccountId || !this.adminPrivateKey) {
      console.warn(
        "⚠️  Admin credentials not set. Exchange event processing will be limited."
      );
    }

    // Set initial timestamp to current time
    this.lastProcessedTimestamp = new Date().toISOString();
  }

  /**
   * Start listening to Exchange contract events using Hedera Mirror Node polling
   */
  async startEventListeners(): Promise<void> {
    if (this.isListening) {
      console.log("Exchange event listeners already running");
      return;
    }

    if (process.env.DISABLE_EXCHANGE_POLLING === "true") {
      console.log(
        "⚠️  Exchange event polling is disabled by DISABLE_EXCHANGE_POLLING=true"
      );
      return;
    }

    console.log(
      "🎧 Starting Exchange contract event polling (Hedera Mirror Node)..."
    );
    console.log(`   Exchange Contract: ${EXCHANGE_CONTRACT}`);
    console.log(`   Poll Interval: 10 seconds`);

    // Start automatic price updates (every 30 minutes)
    priceOracleService.startAutomaticUpdates(30);

    // Poll for events every 10 seconds
    this.pollingInterval = setInterval(() => {
      this.pollForEvents().catch((error) => {
        console.error("Error polling for events:", error);
      });
    }, 10000); // Poll every 10 seconds

    // Initial poll
    this.pollForEvents().catch(console.error);

    this.isListening = true;
    console.log("✅ Exchange event polling started successfully");
  }

  /**
   * Poll Hedera Mirror Node for contract events
   */
  private async pollForEvents(): Promise<void> {
    try {
      // Convert timestamp to seconds (Mirror Node uses seconds since epoch)
      const timestampSeconds = Math.floor(
        new Date(this.lastProcessedTimestamp).getTime() / 1000
      );

      // Query Mirror Node for contract results
      const response = await axios.get(
        `${HEDERA_MIRROR_NODE}/contracts/results/logs`,
        {
          params: {
            "contract.id": EXCHANGE_CONTRACT,
            order: "asc",
            limit: 100,
            timestamp: `gt:${timestampSeconds}`,
          },
        }
      );

      const logs = response.data.logs || [];

      if (logs.length > 0) {
        console.log(`\n📦 Found ${logs.length} new events to process`);

        for (const log of logs) {
          await this.processLog(log);

          // Update last processed timestamp (Mirror Node returns timestamp in format "seconds.nanoseconds")
          if (log.timestamp) {
            this.lastProcessedTimestamp = new Date(
              parseFloat(log.timestamp) * 1000
            ).toISOString();
          }
        }
      }
    } catch (error: any) {
      // Only log if it's not a 404 (no logs found)
      if (error.response?.status !== 404 && error.response?.status !== 400) {
        console.error("Error polling for events:", error.message);
      }
    }
  }

  /**
   * Process a single log entry
   */
  private async processLog(log: any): Promise<void> {
    try {
      const topics = log.topics || [];
      if (topics.length === 0) return;

      const eventSignature = topics[0];
      const data = log.data || "0x";
      const transactionHash = log.transaction_hash;

      // TokenDeposited(address indexed user, address indexed token, uint256 amount)
      if (eventSignature === this.TOKEN_DEPOSITED_TOPIC) {
        const user = "0x" + topics[1].slice(26); // Extract address from indexed parameter
        const token = "0x" + topics[2].slice(26); // Extract address from indexed parameter
        const amount = BigInt(data); // Non-indexed parameter

        console.log("\n💰 TokenDeposited Event Detected:");
        console.log(`   User: ${user}`);
        console.log(`   Token: ${token}`);
        console.log(`   Amount: ${amount.toString()}`);
        console.log(`   Tx: ${transactionHash}`);

        // Skip if user is address(0) - this is admin adding liquidity
        if (
          user.toLowerCase() === "0x0000000000000000000000000000000000000000"
        ) {
          console.log("   ⏭️  Admin liquidity addition, skipping...");
          return;
        }

        await this.handleTokenToNaira(user, token, amount, transactionHash);
      }
      // HbarDeposited(address indexed user, uint256 amount)
      else if (eventSignature === this.HBAR_DEPOSITED_TOPIC) {
        const user = "0x" + topics[1].slice(26); // Extract address from indexed parameter
        const amount = BigInt(data); // Non-indexed parameter

        console.log("\n💰 HbarDeposited Event Detected:");
        console.log(`   User: ${user}`);
        console.log(`   Amount: ${amount.toString()} wei`);
        console.log(`   Tx: ${transactionHash}`);

        // Skip if user is address(0) - this is admin adding liquidity
        if (
          user.toLowerCase() === "0x0000000000000000000000000000000000000000"
        ) {
          console.log("   ⏭️  Admin liquidity addition, skipping...");
          return;
        }

        await this.handleHbarToNaira(user, amount, transactionHash);
      }
    } catch (error) {
      console.error("Error processing log:", error);
    }
  }

  /**
   * Stop listening to events
   */
  stopEventListeners(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isListening = false;
    console.log("🛑 Exchange event polling stopped");
  }

  /**
   * Handle Token → Naira swap
   * User deposits token, backend sends naira via PayStack
   */
  private async handleTokenToNaira(
    userAddress: string,
    tokenAddress: string,
    amount: bigint,
    transactionHash: string
  ): Promise<void> {
    try {
      console.log("\n🔄 Processing Token → Naira swap...");

      // Get token details
      const tokenLower = tokenAddress.toLowerCase();
      const decimals = TOKEN_DECIMALS[tokenLower] || 18;
      const tokenSymbol = TOKEN_SYMBOLS[tokenLower] || "TOKEN";

      // Get real-time exchange rate from price oracle
      const rate = await priceOracleService.getTokenNgnRate(tokenSymbol);

      if (!rate) {
        console.error(`❌ No exchange rate found for token: ${tokenAddress}`);
        return;
      }

      // Calculate naira amount
      const tokenAmount = parseFloat(ethers.formatUnits(amount, decimals));
      const nairaAmount = tokenAmount * rate;
      const nairaInKobo = Math.floor(nairaAmount * 100); // Convert to kobo

      console.log(`   Token: ${tokenSymbol}`);
      console.log(`   Token amount: ${tokenAmount}`);
      console.log(`   Rate: 1 ${tokenSymbol} = ₦${rate.toFixed(2)} NGN`);
      console.log(`   Naira amount: ₦${nairaAmount.toFixed(2)} NGN`);

      // Find user by wallet address
      const wallet = await Wallet.findOne({ evmAddress: userAddress });
      if (!wallet) {
        console.error(`❌ Wallet not found for address: ${userAddress}`);
        return;
      }

      const user = await User.findById(wallet.userId);
      if (!user) {
        console.error(`❌ User not found for wallet: ${wallet._id}`);
        return;
      }

      // Get user's bank account
      const bankAccount = await BankAccount.findOne({ userId: user._id });
      if (!bankAccount) {
        console.error(`❌ No bank account found for user: ${user.email}`);
        return;
      }

      // Create PayStack transfer recipient if not exists
      let recipientCode = bankAccount.recipientCode;
      if (!recipientCode) {
        const recipientResult = await paystackService.createTransferRecipient(
          `${user.firstName} ${user.lastName}`,
          bankAccount.accountNumber,
          bankAccount.bankCode
        );

        if (!recipientResult.status) {
          console.error(
            `❌ Failed to create recipient: ${recipientResult.message}`
          );
          return;
        }

        recipientCode = recipientResult.data.recipient_code;
        // Save recipient code to database
        bankAccount.recipientCode = recipientCode;
        await bankAccount.save();
      }

      // Initiate PayStack transfer
      console.log(`   Sending ${nairaAmount} NGN to user's bank account...`);
      if (!recipientCode) {
        console.error(`❌ Recipient code not found`);
        return;
      }
      const transferResult = await paystackService.initiateTransfer(
        recipientCode,
        nairaInKobo,
        `Token withdrawal - ${tokenAmount} tokens`
      );

      if (transferResult.status) {
        console.log(
          `✅ Transfer successful! Transfer code: ${transferResult.data.transfer_code}`
        );

        // Log activity
        await activityService.createActivity({
          userId: wallet.userId.toString(),
          activityType: "swap",
          amount: tokenAmount.toString(),
          fromToken: tokenAddress,
          toToken: "NGN",
          transactionHash,
          status: "success",
          metadata: {
            direction: "token_to_naira",
            nairaAmount: nairaAmount.toString(),
            rate: rate.toString(),
            transferCode: transferResult.data.transfer_code,
          },
        });
      } else {
        console.error(`❌ Transfer failed: ${transferResult.message}`);
      }
    } catch (error) {
      console.error("❌ Error handling Token → Naira swap:", error);
    }
  }

  /**
   * Handle HBAR → Naira swap
   */
  private async handleHbarToNaira(
    userAddress: string,
    amount: bigint,
    transactionHash: string
  ): Promise<void> {
    try {
      console.log("\n🔄 Processing HBAR → Naira swap...");

      // Get real-time HBAR/NGN rate from price oracle
      const rate = await priceOracleService.getHbarNgnRate();

      // Calculate naira amount
      const hbarAmount = parseFloat(ethers.formatUnits(amount, 8));
      const nairaAmount = hbarAmount * rate;
      const nairaInKobo = Math.floor(nairaAmount * 100);

      console.log(`   HBAR amount: ${hbarAmount}`);
      console.log(`   Rate: 1 HBAR = ₦${rate.toFixed(2)} NGN`);
      console.log(`   Naira amount: ₦${nairaAmount.toFixed(2)} NGN`);

      // Find user by wallet address
      const wallet = await Wallet.findOne({ evmAddress: userAddress });
      if (!wallet) {
        console.error(`❌ Wallet not found for address: ${userAddress}`);
        return;
      }

      const user = await User.findById(wallet.userId);
      if (!user) {
        console.error(`❌ User not found for wallet: ${wallet._id}`);
        return;
      }

      // Get bank account
      const bankAccount = await BankAccount.findOne({ userId: user._id });
      if (!bankAccount) {
        console.error(`❌ No bank account found for user: ${user.email}`);
        return;
      }

      let recipientCode = bankAccount.recipientCode;
      if (!recipientCode) {
        const recipientResult = await paystackService.createTransferRecipient(
          `${user.firstName} ${user.lastName}`,
          bankAccount.accountNumber,
          bankAccount.bankCode
        );

        if (!recipientResult.status) {
          console.error(
            `❌ Failed to create recipient: ${recipientResult.message}`
          );
          return;
        }

        recipientCode = recipientResult.data.recipient_code;
        bankAccount.recipientCode = recipientCode;
        await bankAccount.save();
      }

      // Initiate PayStack transfer
      console.log(`   Sending ${nairaAmount} NGN to user's bank account...`);
      if (!recipientCode) {
        console.error(`❌ Recipient code not found`);
        return;
      }
      const transferResult = await paystackService.initiateTransfer(
        recipientCode,
        nairaInKobo,
        `HBAR withdrawal - ${hbarAmount} HBAR`
      );

      if (transferResult.status) {
        console.log(
          `✅ Transfer successful! Transfer code: ${transferResult.data.transfer_code}`
        );

        // Log activity
        await activityService.createActivity({
          userId: wallet.userId.toString(),
          activityType: "swap",
          amount: hbarAmount.toString(),
          fromToken: "HBAR",
          toToken: "NGN",
          transactionHash,
          status: "success",
          metadata: {
            direction: "hbar_to_naira",
            nairaAmount: nairaAmount.toString(),
            rate: rate.toString(),
            transferCode: transferResult.data.transfer_code,
          },
        });
      } else {
        console.error(`❌ Transfer failed: ${transferResult.message}`);
      }
    } catch (error) {
      console.error("❌ Error handling HBAR → Naira swap:", error);
    }
  }

  /**
   * Handle Naira → Token swap (called from PayStack webhook)
   * User pays naira, backend sends token from Exchange contract
   */
  async handleNairaToToken(
    userAddress: string,
    userId: string,
    tokenAddress: string,
    nairaAmount: number,
    paystackReference: string
  ): Promise<{ success: boolean; txId?: string }> {
    try {
      console.log("\n🔄 Processing Naira → Token swap...");
      console.log(`   User: ${userAddress}`);
      console.log(`   Token: ${tokenAddress}`);
      console.log(`   Naira amount: ₦${nairaAmount.toFixed(2)} NGN`);

      // Get token details
      const tokenLower = tokenAddress.toLowerCase();
      const decimals = TOKEN_DECIMALS[tokenLower] || 18;
      const tokenSymbol = TOKEN_SYMBOLS[tokenLower] || "TOKEN";

      // Get real-time exchange rate from price oracle
      const rate = await priceOracleService.getTokenNgnRate(tokenSymbol);

      if (!rate) {
        console.error(`❌ No exchange rate found for token: ${tokenAddress}`);
        return { success: false };
      }

      // Calculate token amount
      const tokenAmount = nairaAmount / rate;
      const tokenAmountBigInt = ethers.parseUnits(
        tokenAmount.toFixed(decimals),
        decimals
      );

      console.log(`   Rate: 1 ${tokenSymbol} = ₦${rate.toFixed(2)} NGN`);
      console.log(
        `   Token amount: ${tokenAmount.toFixed(decimals)} ${tokenSymbol}`
      );

      // Initialize Hedera client with admin account
      const client = Client.forTestnet();
      const accountId = AccountId.fromString(this.adminAccountId);
      const privateKey = PrivateKey.fromStringECDSA(this.adminPrivateKey);
      client.setOperator(accountId, privateKey);

      // Diagnostics: authorized withdrawer and liquidity
      try {
        const rpc = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
        const exchangeAbi = [
          "function authorizedWithdrawer() view returns (address)",
        ];
        const erc20Abi = [
          "function balanceOf(address) view returns (uint256)",
          "function decimals() view returns (uint8)",
          "function symbol() view returns (string)",
        ];

        const exchangeRead = new ethers.Contract(
          EXCHANGE_CONTRACT,
          exchangeAbi,
          rpc
        );
        const auth = await exchangeRead.authorizedWithdrawer();
        console.log(`   Exchange.authorizedWithdrawer: ${auth}`);

        const tokenRead = new ethers.Contract(tokenAddress, erc20Abi, rpc);
        const exBalance = await tokenRead.balanceOf(EXCHANGE_CONTRACT);
        const tokenSym = await tokenRead.symbol().catch(() => tokenSymbol);
        const tokenDec = await tokenRead.decimals().catch(() => decimals);
        const exBalHuman = parseFloat(ethers.formatUnits(exBalance, tokenDec));
        console.log(
          `   Exchange ${tokenSym} balance: ${exBalHuman} (needs ≥ ${tokenAmount.toFixed(
            decimals
          )})`
        );
      } catch (diagErr) {
        console.warn(
          "   (diag) Failed to fetch exchange diagnostics:",
          diagErr
        );
      }

      // Encode transferToUser function call
      const transferInterface = new ethers.Interface([
        "function transferToUser(address token, address to, uint256 amount)",
      ]);
      const transferData = transferInterface.encodeFunctionData(
        "transferToUser",
        [tokenAddress, userAddress, tokenAmountBigInt]
      );

      // Convert EVM address to Hedera ContractId
      const exchangeContractId = evmAddressToContractId(EXCHANGE_CONTRACT);

      console.log(`   Sending ${tokenAmount} tokens to user...`);

      const transaction = new ContractExecuteTransaction()
        .setContractId(exchangeContractId)
        .setGas(800000)
        .setFunctionParameters(Buffer.from(transferData.slice(2), "hex"));

      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);

      const statusStr = receipt.status.toString();
      console.log(`   Tx: ${txResponse.transactionId.toString()}`);
      console.log(`   Status: ${statusStr}`);
      if (statusStr !== "SUCCESS") {
        console.error("❌ Token transfer failed at receipt stage");
        client.close();
        return { success: false };
      }

      client.close();

      // Log activity
      await activityService.createActivity({
        userId,
        activityType: "swap",
        amount: tokenAmount.toString(),
        fromToken: "NGN",
        toToken: tokenAddress,
        transactionHash: txResponse.transactionId.toString(),
        status: receipt.status.toString() === "SUCCESS" ? "success" : "failed",
        metadata: {
          direction: "naira_to_token",
          nairaAmount: nairaAmount.toString(),
          rate: rate.toString(),
          paystackReference,
        },
      });

      // Note: NGN balance deduction is handled in the webhook controller
      // (webhook.controller.ts handleChargeSuccess) to ensure it happens
      // atomically with the transaction processing

      return { success: true, txId: txResponse.transactionId.toString() };
    } catch (error) {
      console.error("❌ Error handling Naira → Token swap:", error);
      return { success: false };
    }
  }

  /**
   * Handle Naira → HBAR swap (called from PayStack webhook)
   */
  async handleNairaToHbar(
    userAddress: string,
    userId: string,
    nairaAmount: number,
    paystackReference: string
  ): Promise<{ success: boolean; txId?: string }> {
    try {
      console.log("\n🔄 Processing Naira → HBAR swap...");
      console.log(`   User: ${userAddress}`);
      console.log(`   Naira amount: ₦${nairaAmount.toFixed(2)} NGN`);

      // Get real-time HBAR/NGN rate from price oracle
      const rate = await priceOracleService.getHbarNgnRate();

      // Calculate HBAR amount
      const hbarAmount = nairaAmount / rate;
      const hbarAmountBigInt = ethers.parseUnits(hbarAmount.toFixed(8), 8);

      console.log(`   Rate: 1 HBAR = ₦${rate.toFixed(2)} NGN`);
      console.log(`   HBAR amount: ${hbarAmount.toFixed(8)} HBAR`);

      // Initialize Hedera client with admin account
      const client = Client.forTestnet();
      const accountId = AccountId.fromString(this.adminAccountId);
      const privateKey = PrivateKey.fromStringECDSA(this.adminPrivateKey);
      client.setOperator(accountId, privateKey);

      // Diagnostics: authorized withdrawer and HBAR liquidity
      try {
        const rpc = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
        const exchangeAbi = [
          "function authorizedWithdrawer() view returns (address)",
        ];
        const exchangeRead = new ethers.Contract(
          EXCHANGE_CONTRACT,
          exchangeAbi,
          rpc
        );
        const auth = await exchangeRead.authorizedWithdrawer();
        const hbarBal = await rpc.getBalance(EXCHANGE_CONTRACT);
        console.log(`   Exchange.authorizedWithdrawer: ${auth}`);
        console.log(
          `   Exchange HBAR balance: ${ethers.formatUnits(
            hbarBal,
            8
          )} (needs ≥ ${hbarAmount.toFixed(8)})`
        );
      } catch (diagErr) {
        console.warn("   (diag) Failed to fetch HBAR diagnostics:", diagErr);
      }

      // Encode transferHbarToUser function call
      const transferInterface = new ethers.Interface([
        "function transferHbarToUser(address payable to, uint256 amount)",
      ]);
      const transferData = transferInterface.encodeFunctionData(
        "transferHbarToUser",
        [userAddress, hbarAmountBigInt]
      );

      // Convert EVM address to Hedera ContractId
      const exchangeContractId = evmAddressToContractId(EXCHANGE_CONTRACT);

      console.log(`   Sending ${hbarAmount} HBAR to user...`);

      const transaction = new ContractExecuteTransaction()
        .setContractId(exchangeContractId)
        .setGas(800000)
        .setFunctionParameters(Buffer.from(transferData.slice(2), "hex"));

      const txResponse = await transaction.execute(client);
      const receipt = await txResponse.getReceipt(client);

      const statusStr = receipt.status.toString();
      console.log(`   Tx: ${txResponse.transactionId.toString()}`);
      console.log(`   Status: ${statusStr}`);
      if (statusStr !== "SUCCESS") {
        console.error("❌ HBAR transfer failed at receipt stage");
        client.close();
        return { success: false };
      }

      client.close();

      // Log activity
      await activityService.createActivity({
        userId,
        activityType: "swap",
        amount: hbarAmount.toString(),
        fromToken: "NGN",
        toToken: "HBAR",
        transactionHash: txResponse.transactionId.toString(),
        status: receipt.status.toString() === "SUCCESS" ? "success" : "failed",
        metadata: {
          direction: "naira_to_hbar",
          nairaAmount: nairaAmount.toString(),
          rate: rate.toString(),
          paystackReference,
        },
      });

      // Note: NGN balance deduction is handled in the webhook controller
      // (webhook.controller.ts handleChargeSuccess) to ensure it happens
      // atomically with the transaction processing

      return { success: true, txId: txResponse.transactionId.toString() };
    } catch (error) {
      console.error("❌ Error handling Naira → HBAR swap:", error);
      return { success: false };
    }
  }

  /**
   * Get exchange rates (fetches real-time rates)
   */
  async getExchangeRates(): Promise<Record<string, number>> {
    const prices = await priceOracleService.getCachedPrices();

    return {
      [USDC_TOKEN.toLowerCase()]: prices.usdc_ngn,
      [USDT_TOKEN.toLowerCase()]: prices.usdt_ngn,
      [DAI_TOKEN.toLowerCase()]: prices.dai_ngn,
      hbar: prices.hbar_ngn,
    };
  }

  /**
   * Calculate expected output for a swap
   */
  async calculateSwapOutput(
    fromToken: string,
    toToken: string,
    amount: number
  ): Promise<{ output: number; rate: number }> {
    const prices = await priceOracleService.getCachedPrices();

    const fromUpper = fromToken.toUpperCase();
    const toUpper = toToken.toUpperCase();

    // Get fromToken rate (in NGN)
    let fromRate: number;
    if (fromUpper === "HBAR") {
      fromRate = prices.hbar_ngn;
    } else if (fromUpper === "NGN") {
      fromRate = 1;
    } else {
      // Check if it's an address
      const fromSymbol = TOKEN_SYMBOLS[fromToken.toLowerCase()] || fromUpper;
      fromRate = await priceOracleService.getTokenNgnRate(fromSymbol);
    }

    // Get toToken rate (in NGN)
    let toRate: number;
    if (toUpper === "HBAR") {
      toRate = prices.hbar_ngn;
    } else if (toUpper === "NGN") {
      toRate = 1;
    } else {
      // Check if it's an address
      const toSymbol = TOKEN_SYMBOLS[toToken.toLowerCase()] || toUpper;
      toRate = await priceOracleService.getTokenNgnRate(toSymbol);
    }

    if (!fromRate || !toRate) {
      return { output: 0, rate: 0 };
    }

    // Convert to naira first, then to target token
    const nairaValue = amount * fromRate;
    const output = toRate === 1 ? nairaValue : nairaValue / toRate;

    return {
      output,
      rate: fromRate / toRate,
    };
  }
}

export const exchangeService = new ExchangeService();
