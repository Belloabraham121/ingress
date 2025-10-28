# 🏦 Vault Integration Guide

Complete guide for integrating the VaultFactory contract with your frontend using the `useVaults` hook.

## 📦 Installation

First, install the required dependency:

```bash
cd frontend
npm install ethers
```

## 📁 Files Created

### 1. Contract ABI

- **`lib/contracts/VaultFactory.json`** - VaultFactory contract ABI and address

### 2. TypeScript Types

- **`types/vault.ts`** - TypeScript interfaces for vault data

### 3. Utilities

- **`lib/vault-utils.ts`** - Utility functions for formatting and calculations

### 4. Custom Hook

- **`hooks/useVaults.ts`** - Main React hook for vault interactions

### 5. Example Component

- **`components/vault-list.tsx`** - Example component showing vault list

## 🚀 Quick Start

### Basic Usage

```typescript
import { useVaults } from "@/hooks/useVaults";

function MyVaultComponent() {
  const { vaults, stats, isLoading, error, refresh } = useVaults();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Total Vaults: {stats?.totalVaults}</h1>
      {vaults.map((vault) => (
        <div key={vault.vaultAddress}>
          <h2>{vault.name}</h2>
          <p>APY: {vault.apr}%</p>
          <p>TVL: {vault.tvl}</p>
        </div>
      ))}
    </div>
  );
}
```

### Fetch Single Vault

```typescript
const { fetchVaultDetails } = useVaults();

const loadVault = async () => {
  const vault = await fetchVaultDetails("0x...");
  if (vault) {
    console.log(vault.name, vault.apr);
  }
};
```

### Fetch Only Active Vaults

```typescript
const { fetchActiveVaults, vaults } = useVaults();

useEffect(() => {
  fetchActiveVaults();
}, [fetchActiveVaults]);
```

### Sort Vaults

```typescript
const { sortVaultsBy } = useVaults();

// Sort by APY (highest first)
sortVaultsBy("apr", false);

// Sort by TVL (highest first)
sortVaultsBy("tvl", false);

// Sort by creation date (newest first)
sortVaultsBy("created", false);
```

### Filter Vaults

```typescript
const { filterVaultsBy, vaults } = useVaults();

// Get only active vaults with APY > 10%
const filtered = filterVaultsBy({
  activeOnly: true,
  minAPR: 10,
});

// Search by name or symbol
const searched = filterVaultsBy({
  searchTerm: "USDT",
});
```

## 📊 Available Data

### Vault Details

Each vault object contains:

```typescript
interface FormattedVaultDetails {
  // Basic Info
  vaultAddress: string; // Vault contract address
  asset: string; // Underlying token address
  creator: string; // Vault creator address
  name: string; // Vault name (e.g., "High Yield USDT Vault")
  symbol: string; // Vault symbol (e.g., "hyUSDT")

  // APY Info
  apr: number; // APY as percentage (e.g., 18.0)
  aprBps: number; // APY in basis points (e.g., 1800)

  // Financial Data
  totalUserDeposits: string; // Formatted string (e.g., "10,000")
  totalUserDepositsRaw: bigint; // Raw bigint value
  rewardsPoolRemaining: string; // Formatted string
  rewardsPoolRemainingRaw: bigint; // Raw bigint value
  tvl: string; // Total Value Locked (formatted)
  tvlRaw: bigint; // TVL (raw)

  // Metadata
  createdAt: Date; // Creation date
  vaultIndex: number; // Index in factory
  active: boolean; // Is vault active?
  depositorCount: number; // Number of depositors

  // Calculated Fields
  utilizationRate: number; // 0-100 percentage
  daysRemaining?: number; // Days until rewards depleted
  dailyRewards?: string; // Estimated daily rewards payout
}
```

### Stats Summary

```typescript
interface VaultStats {
  totalVaults: number; // Total vaults created
  activeVaults: number; // Number of active vaults
  totalTVL: string; // Total value locked (formatted)
  totalTVLRaw: bigint; // Total value locked (raw)
  totalRewardsPool: string; // Total rewards available (formatted)
  totalRewardsPoolRaw: bigint; // Total rewards available (raw)
  totalDepositors: number; // Total unique depositors
}
```

## 🎨 Example Components

### 1. Vault Stats Dashboard

```typescript
import { useVaults } from "@/hooks/useVaults";

export function VaultStatsDashboard() {
  const { stats, isLoading } = useVaults();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div>
        <h3>Total Vaults</h3>
        <p>{stats?.totalVaults}</p>
      </div>
      <div>
        <h3>Total TVL</h3>
        <p>{stats?.totalTVL}</p>
      </div>
      <div>
        <h3>Rewards Pool</h3>
        <p>{stats?.totalRewardsPool}</p>
      </div>
      <div>
        <h3>Depositors</h3>
        <p>{stats?.totalDepositors}</p>
      </div>
    </div>
  );
}
```

### 2. Top Vaults by APY

```typescript
import { useVaults } from "@/hooks/useVaults";
import { useEffect } from "react";

export function TopVaultsByAPY() {
  const { vaults, sortVaultsBy, fetchActiveVaults } = useVaults();

  useEffect(() => {
    fetchActiveVaults();
    sortVaultsBy("apr", false); // Highest APY first
  }, [fetchActiveVaults, sortVaultsBy]);

  return (
    <div>
      <h2>Top Vaults by APY</h2>
      {vaults.slice(0, 5).map((vault) => (
        <div key={vault.vaultAddress}>
          <span>{vault.name}</span>
          <span>{vault.apr}% APY</span>
        </div>
      ))}
    </div>
  );
}
```

### 3. Vault Details Card

```typescript
import { useVaults } from "@/hooks/useVaults";
import { useState, useEffect } from "react";

export function VaultDetailsCard({ vaultAddress }: { vaultAddress: string }) {
  const { fetchVaultDetails } = useVaults();
  const [vault, setVault] = useState(null);

  useEffect(() => {
    const loadVault = async () => {
      const details = await fetchVaultDetails(vaultAddress);
      setVault(details);
    };
    loadVault();
  }, [vaultAddress, fetchVaultDetails]);

  if (!vault) return <div>Loading...</div>;

  return (
    <div className="border rounded-lg p-4">
      <h2>{vault.name}</h2>
      <p>APY: {vault.apr}%</p>
      <p>TVL: {vault.tvl}</p>
      <p>Depositors: {vault.depositorCount}</p>
      <p>Days Remaining: {vault.daysRemaining || "∞"}</p>
    </div>
  );
}
```

## 🔧 Utility Functions

### Format Token Amount

```typescript
import { formatTokenAmount } from "@/lib/vault-utils";

const amount = BigInt("1000000000000000000000"); // 1000 tokens
const formatted = formatTokenAmount(amount, 18, 2); // "1,000.00"
```

### Calculate Daily Rewards

```typescript
import { calculateDailyRewards } from "@/lib/vault-utils";

const deposits = BigInt("10000000000000000000000"); // 10,000 tokens
const aprBps = 1800; // 18%
const daily = calculateDailyRewards(deposits, aprBps);
console.log(formatTokenAmount(daily)); // Daily rewards
```

### Sort and Filter

```typescript
import { sortVaults, filterVaults } from "@/lib/vault-utils";

// Sort by TVL
const sorted = sortVaults(vaults, "tvl", false);

// Filter active vaults with min APY
const filtered = filterVaults(vaults, {
  activeOnly: true,
  minAPR: 10,
  searchTerm: "USDT",
});
```

## 🌐 Network Configuration

### Hedera Testnet (Default)

```typescript
const HEDERA_TESTNET_RPC = "https://testnet.hashio.io/api";
const VAULT_FACTORY_ADDRESS = "0x29021eaeb230Bc84120C0f05FDD83C446270c4f7";
```

### Hedera Mainnet

To use mainnet, update the RPC URL in `hooks/useVaults.ts`:

```typescript
const HEDERA_MAINNET_RPC = "https://mainnet.hashio.io/api";
// Also update VAULT_FACTORY_ADDRESS to mainnet address
```

## 📝 Contract Addresses

After deploying your vaults, update these addresses in your frontend:

```typescript
// VaultFactory (already deployed)
const VAULT_FACTORY = "0x29021eaeb230Bc84120C0f05FDD83C446270c4f7";

// Example: Update in a config file
export const CONTRACTS = {
  vaultFactory: "0x29021eaeb230Bc84120C0f05FDD83C446270c4f7",
  tokens: {
    usdt: "0x...", // From deployment output
    usdc: "0x...",
    dai: "0x...",
  },
  vaults: {
    usdt: "0x...", // From deployment output
    usdc: "0x...",
    dai: "0x...",
  },
};
```

## 🔄 Auto-Refresh

The hook automatically fetches vaults on mount. To refresh:

```typescript
const { refresh } = useVaults();

// Manual refresh
<button onClick={refresh}>Refresh</button>;

// Auto-refresh every 30 seconds
useEffect(() => {
  const interval = setInterval(refresh, 30000);
  return () => clearInterval(interval);
}, [refresh]);
```

## 🎯 Use Cases

### 1. Vault Explorer Page

Display all vaults with filtering and sorting.

### 2. Dashboard Stats

Show aggregate statistics across all vaults.

### 3. Individual Vault Page

Deep dive into a single vault's details.

### 4. Deposit Flow

Fetch vault details before allowing deposits.

### 5. Portfolio View

Show user's positions across multiple vaults.

## 🐛 Error Handling

```typescript
const { error, setError } = useVaults();

// Display errors
{
  error && <Alert variant="destructive">{error}</Alert>;
}

// Clear errors
<button onClick={() => setError(null)}>Clear Error</button>;

// Handle specific errors
useEffect(() => {
  if (error?.includes("network")) {
    // Handle network error
  }
}, [error]);
```

## 🚀 Performance Tips

1. **Pagination**: For many vaults, implement pagination
2. **Caching**: Cache vault data in localStorage
3. **Lazy Loading**: Load vault details on demand
4. **Debouncing**: Debounce search/filter operations

## 📚 Additional Resources

- [VaultFactory Contract](../contract/src/VaultFactory.sol)
- [RewardVault Contract](../contract/src/RewardVault.sol)
- [Deployment Guide](../contract/VAULT_DEPLOYMENT_GUIDE.md)
- [Hedera EVM Docs](https://docs.hedera.com/hedera/core-concepts/smart-contracts)

## 🎉 Complete Example

See `components/vault-list.tsx` for a complete, production-ready example showing:

- ✅ Stats dashboard
- ✅ Vault cards
- ✅ Loading states
- ✅ Error handling
- ✅ Sorting controls
- ✅ Refresh functionality

Happy building! 🚀
