import axios from "axios";

/**
 * Price Oracle Service
 * Fetches real-time exchange rates from various sources
 */

// Hedera Mirror Node endpoints
const HEDERA_MAINNET_MIRROR = "https://mainnet.mirrornode.hedera.com/api/v1";
const HEDERA_TESTNET_MIRROR = "https://testnet.mirrornode.hedera.com/api/v1";

// USD to NGN rate (can be fetched from a forex API)
// Using a fixed rate for now, but should be updated regularly
const USD_TO_NGN_RATE = 1650; // 1 USD = 1650 NGN (update this regularly)

interface HbarExchangeRate {
  current_rate: {
    cent_equivalent: number;
    expiration_time: number;
    hbar_equivalent: number;
  };
  next_rate: {
    cent_equivalent: number;
    expiration_time: number;
    hbar_equivalent: number;
  };
  timestamp: string;
}

interface TokenPrices {
  hbar_usd: number;
  hbar_ngn: number;
  usd_ngn: number;
  usdc_ngn: number;
  usdt_ngn: number;
  dai_ngn: number;
  lastUpdated: Date;
}

class PriceOracleService {
  private cachedPrices: TokenPrices | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private isTestnet: boolean;

  constructor() {
    // Determine network from environment
    this.isTestnet = process.env.HEDERA_NETWORK !== "mainnet";
  }

  /**
   * Get HBAR/USD rate from Hedera Mirror Node
   */
  async getHbarUsdRate(): Promise<number> {
    // try {
    //   const mirrorNode = this.isTestnet
    //     ? HEDERA_TESTNET_MIRROR
    //     : HEDERA_MAINNET_MIRROR;

    //   const response = await axios.get<HbarExchangeRate>(
    //     `${mirrorNode}/network/exchangerate`
    //   );

    //   const { cent_equivalent, hbar_equivalent } = response.data.current_rate;

    //   // Calculate USD per HBAR
    //   // 1 HBAR = (cent_equivalent / hbar_equivalent) cents
    //   const centsPerHbar = cent_equivalent / hbar_equivalent;
    //   const usdPerHbar = centsPerHbar / 100; // Convert cents to dollars

    //   console.log(`📊 HBAR/USD Rate: $${usdPerHbar.toFixed(4)}`);
    //   console.log(
    //     `   Source: Hedera Mirror Node (${
    //       this.isTestnet ? "Testnet" : "Mainnet"
    //     })`
    //   );

    //   return usdPerHbar;
    // } catch (error) {
    //   console.error("Error fetching HBAR/USD rate from mirror node:", error);
    //   // Return fallback rate (approximately $0.06)
    //   return 0.06;
    // }

    // Using fixed ETH price for MNT
    const mntUsdPrice = 3381;
    console.log(`📊 MNT/USD Rate: $${mntUsdPrice}`);
    console.log("   Source: Fixed ETH price");
    return mntUsdPrice;
  }

  /**
   * Get USD/NGN rate from Fixer.io API
   */
  async getUsdNgnRate(): Promise<number> {
    try {
      const fixerApiKey =
        process.env.FIXER_API_KEY || "a30dc97c7bac2b7520a9656dfb7c5da6";

      // Use Fixer.io API to get real-time USD/NGN rate
      const response = await axios.get(
        `https://data.fixer.io/api/latest?access_key=${fixerApiKey}&base=EUR&symbols=USD,NGN`
      );

      if (response.data.success) {
        // Fixer.io uses EUR as base, so we need to calculate USD/NGN
        const usdRate = response.data.rates.USD;
        const ngnRate = response.data.rates.NGN;

        // Calculate USD to NGN: (NGN/EUR) / (USD/EUR) = NGN/USD
        const usdToNgn = ngnRate / usdRate;

        console.log(`💵 USD/NGN Rate: ₦${usdToNgn.toFixed(2)}`);
        console.log("   Source: Fixer.io API (Real-time)");

        return usdToNgn;
      } else {
        console.warn("⚠️  Fixer.io API returned error, using fallback rate");
        return USD_TO_NGN_RATE;
      }
    } catch (error: any) {
      console.error(
        "Error fetching USD/NGN rate from Fixer.io:",
        error.message
      );
      console.log(`💵 Using fallback rate: ₦${USD_TO_NGN_RATE}`);
      return USD_TO_NGN_RATE; // Fallback to fixed rate
    }
  }

  /**
   * Get all token prices in NGN
   */
  async getAllPrices(): Promise<TokenPrices> {
    try {
      console.log("\n🔄 Updating exchange rates...");

      // Get HBAR/USD rate from Hedera mirror node
      const hbarUsd = await this.getHbarUsdRate();

      // Get USD/NGN rate
      const usdNgn = await this.getUsdNgnRate();

      // Calculate HBAR/NGN
      const hbarNgn = hbarUsd * usdNgn;

      // Stablecoins are pegged 1:1 with USD
      const usdcNgn = usdNgn;
      const usdtNgn = usdNgn;
      const daiNgn = usdNgn;

      const prices: TokenPrices = {
        hbar_usd: hbarUsd,
        hbar_ngn: hbarNgn,
        usd_ngn: usdNgn,
        usdc_ngn: usdcNgn,
        usdt_ngn: usdtNgn,
        dai_ngn: daiNgn,
        lastUpdated: new Date(),
      };

      this.cachedPrices = prices;

      console.log("\n✅ Exchange rates updated:");
      console.log(
        `   1 HBAR = $${hbarUsd.toFixed(4)} = ₦${hbarNgn.toFixed(2)}`
      );
      console.log(`   1 USDC = ₦${usdcNgn.toFixed(2)}`);
      console.log(`   1 USDT = ₦${usdtNgn.toFixed(2)}`);
      console.log(`   1 DAI  = ₦${daiNgn.toFixed(2)}`);
      console.log(`   Last Updated: ${prices.lastUpdated.toLocaleString()}\n`);

      return prices;
    } catch (error) {
      console.error("Error updating prices:", error);

      // Return cached prices if available, otherwise return defaults
      if (this.cachedPrices) {
        console.log("⚠️  Using cached prices");
        return this.cachedPrices;
      }

      // Fallback to default prices (MNT using ETH price)
      return {
        hbar_usd: 3381,
        hbar_ngn: 5578650,
        usd_ngn: 1650,
        usdc_ngn: 1650,
        usdt_ngn: 1650,
        dai_ngn: 1650,
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Get cached prices (or fetch if not cached)
   */
  async getCachedPrices(): Promise<TokenPrices> {
    if (!this.cachedPrices) {
      return await this.getAllPrices();
    }

    // Check if prices are stale (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (this.cachedPrices.lastUpdated < oneHourAgo) {
      console.log("⏰ Cached prices are stale, updating...");
      return await this.getAllPrices();
    }

    return this.cachedPrices;
  }

  /**
   * Start automatic price updates
   * @param intervalMinutes - Update interval in minutes (default: 30)
   */
  startAutomaticUpdates(intervalMinutes: number = 30): void {
    if (this.updateInterval) {
      console.log("⚠️  Price updates already running");
      return;
    }

    console.log(
      `🚀 Starting automatic price updates every ${intervalMinutes} minutes`
    );

    // Initial update
    this.getAllPrices();

    // Schedule periodic updates
    this.updateInterval = setInterval(() => {
      this.getAllPrices().catch(console.error);
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop automatic price updates
   */
  stopAutomaticUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log("🛑 Stopped automatic price updates");
    }
  }

  /**
   * Get HBAR price in NGN
   */
  async getHbarNgnRate(): Promise<number> {
    const prices = await this.getCachedPrices();
    return prices.hbar_ngn;
  }

  /**
   * Get token price in NGN
   */
  async getTokenNgnRate(tokenSymbol: string): Promise<number> {
    const prices = await this.getCachedPrices();

    if (!tokenSymbol) {
      console.error("Token symbol is undefined");
      return 0;
    }

    switch (tokenSymbol.toUpperCase()) {
      case "HBAR":
        return prices.hbar_ngn;
      case "USDC":
        return prices.usdc_ngn;
      case "USDT":
        return prices.usdt_ngn;
      case "DAI":
        return prices.dai_ngn;
      case "NGN":
        return 1; // 1 NGN = 1 NGN
      default:
        console.error(`Unsupported token: ${tokenSymbol}`);
        return 0;
    }
  }

  /**
   * Convert token amount to NGN
   */
  async convertToNgn(tokenSymbol: string, amount: number): Promise<number> {
    const rate = await this.getTokenNgnRate(tokenSymbol);
    return amount * rate;
  }

  /**
   * Convert NGN to token amount
   */
  async convertFromNgn(
    tokenSymbol: string,
    nairaAmount: number
  ): Promise<number> {
    const rate = await this.getTokenNgnRate(tokenSymbol);
    return nairaAmount / rate;
  }
}

export const priceOracleService = new PriceOracleService();
