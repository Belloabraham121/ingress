# 🚀 Vault Deployment Summary

## What's Been Updated

I've modified the deployment system to deploy **separate tokens** for USDT, USDC, and DAI instead of using a single mock token.

## Key Changes

### 1. **Separate Token Deployment**

- ✅ Deploys 3 distinct ERC20 tokens (USDT, USDC, DAI)
- ✅ Each token has proper name and symbol
- ✅ Mints 1,000,000 tokens of each to deployer

### 2. **Updated Initial Rewards**

- ✅ Changed from 10,000,000 to **100,000 tokens** per vault
- ✅ Uses 100,000 tokens from minted supply for each vault
- ✅ Deployer keeps 900,000 tokens of each for testing

## Deployment Flow

```
1. Deploy USDT token → Mint 1,000,000 USDT
2. Deploy USDC token → Mint 1,000,000 USDC
3. Deploy DAI token → Mint 1,000,000 DAI
4. Deploy USDT Vault (18% APY) → Use 100,000 USDT as rewards
5. Deploy USDC Vault (12% APY) → Use 100,000 USDC as rewards
6. Deploy DAI Vault (15% APY) → Use 100,000 DAI as rewards
```

## After Deployment

### Token Balances

- **USDT**: 1,000,000 minted → 100,000 to vault, **900,000 to deployer**
- **USDC**: 1,000,000 minted → 100,000 to vault, **900,000 to deployer**
- **DAI**: 1,000,000 minted → 100,000 to vault, **900,000 to deployer**

### Vault Rewards (after 5% factory fee)

- **USDT Vault**: 95,000 tokens in rewards pool
- **USDC Vault**: 95,000 tokens in rewards pool
- **DAI Vault**: 95,000 tokens in rewards pool

## How to Deploy

### Option 1: One-Click Script

```bash
cd contract
./deploy-vaults.sh
```

### Option 2: Manual

```bash
cd contract
forge script script/DeployVaults.s.sol:DeployVaults \
  --rpc-url https://testnet.hashio.io/api \
  --broadcast \
  --legacy
```

## Expected Output

```
=================================================
DEPLOYING TOKENS AND REWARD VAULTS
=================================================
Deployer: 0xE416db11FB2568434E7A86F33762E37CaCd48469
VaultFactory: 0x29021eaeb230bc84120c0f05fdd83c446270c4f7
Mint Amount per Token: 1000000 tokens
Initial Rewards per Vault: 100000 tokens

=== STEP 1: DEPLOYING TOKENS ===

Deploying USDT token...
  USDT deployed at: 0x...
  Minted 1000000 USDT to deployer

Deploying USDC token...
  USDC deployed at: 0x...
  Minted 1000000 USDC to deployer

Deploying DAI token...
  DAI deployed at: 0x...
  Minted 1000000 DAI to deployer

=== STEP 2: DEPLOYING VAULTS ===

--- Deploying USDT Vault (18% APY) ---
  Token: 0x...
  Name: High Yield USDT Vault
  Symbol: hyUSDT
  APY: 1800 bps ( 18 . 0 %)
  Initial Rewards: 100000
  Min Deposit: 100
  Max Deposit: 100000
  Approving tokens...
  Creating vault...
  Vault created successfully!
USDT Vault deployed at: 0x...

--- Deploying USDC Vault (12% APY) ---
  Token: 0x...
  Name: Stable USDC Vault
  Symbol: sUSDC
  APY: 1200 bps ( 12 . 0 %)
  Initial Rewards: 100000
  Min Deposit: 100
  Max Deposit: 100000
  Approving tokens...
  Creating vault...
  Vault created successfully!
USDC Vault deployed at: 0x...

--- Deploying DAI Vault (15% APY) ---
  Token: 0x...
  Name: Optimized DAI Vault
  Symbol: opDAI
  APY: 1500 bps ( 15 . 0 %)
  Initial Rewards: 100000
  Min Deposit: 100
  Max Deposit: 100000
  Approving tokens...
  Creating vault...
  Vault created successfully!
DAI Vault deployed at: 0x...

=================================================
DEPLOYMENT SUMMARY
=================================================

TOKENS:
  USDT Token: 0x...
  USDC Token: 0x...
  DAI Token: 0x...

VAULTS:
  USDT Vault (18% APY): 0x...
  USDC Vault (12% APY): 0x...
  DAI Vault (15% APY): 0x...

BALANCES:
  Deployer USDT: 900000 tokens
  Deployer USDC: 900000 tokens
  Deployer DAI: 900000 tokens
=================================================

NOTE: Save these addresses for frontend integration!

=================================================
VERIFICATION
=================================================
Total vaults in factory: 3
All vaults verified successfully!
=================================================
```

## Configuration Parameters

| Parameter                | Value            | Description                 |
| ------------------------ | ---------------- | --------------------------- |
| **MINT_AMOUNT**          | 1,000,000 tokens | Amount minted per token     |
| **INITIAL_REWARDS**      | 100,000 tokens   | Rewards deposited per vault |
| **USDT_APY**             | 1800 (18%)       | USDT vault APY              |
| **USDC_APY**             | 1200 (12%)       | USDC vault APY              |
| **DAI_APY**              | 1500 (15%)       | DAI vault APY               |
| **MIN_DEPOSIT**          | 100 tokens       | Minimum user deposit        |
| **MAX_DEPOSIT_PER_USER** | 100,000 tokens   | Maximum per user            |

## Files Modified

1. **`script/DeployVaults.s.sol`**

   - Added token deployment logic
   - Added minting functionality
   - Updated INITIAL_REWARDS from 10M to 100K
   - Enhanced logging with token addresses

2. **`deploy-vaults.sh`**

   - Removed manual token minting
   - Updated description
   - Simplified workflow

3. **`VAULT_DEPLOYMENT_GUIDE.md`**
   - Updated prerequisites
   - Removed token balance requirements
   - Added new deployment flow

## Testing After Deployment

### 1. Verify Token Deployment

```bash
# Check USDT balance
cast call USDT_ADDRESS "balanceOf(address)" YOUR_ADDRESS --rpc-url $RPC_URL

# Expected: 900000000000000000000000 (900,000 * 1e18)
```

### 2. Verify Vault Deployment

```bash
# Check USDT vault info
cast call USDT_VAULT_ADDRESS "getVaultInfo()" --rpc-url $RPC_URL

# Check rewards pool
cast call USDT_VAULT_ADDRESS "rewardsPool()" --rpc-url $RPC_URL

# Expected: 95000000000000000000000 (95,000 * 1e18 after 5% fee)
```

### 3. Test User Deposit

```bash
# Approve vault
cast send USDT_ADDRESS \
  "approve(address,uint256)" \
  USDT_VAULT_ADDRESS \
  1000000000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy

# Deposit 1000 USDT
cast send USDT_VAULT_ADDRESS \
  "deposit(uint256)" \
  1000000000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy

# Wait 60 seconds, then check rewards
sleep 60
cast call USDT_VAULT_ADDRESS \
  "calculatePendingRewards(address)" \
  YOUR_ADDRESS \
  --rpc-url $RPC_URL
```

## Rewards Calculation

### Example: Depositing 10,000 tokens

| Vault | APY | Daily Rewards | Monthly Rewards | Yearly Rewards |
| ----- | --- | ------------- | --------------- | -------------- |
| USDT  | 18% | ~4.93 tokens  | ~150 tokens     | 1,800 tokens   |
| USDC  | 12% | ~3.29 tokens  | ~100 tokens     | 1,200 tokens   |
| DAI   | 15% | ~4.11 tokens  | ~125 tokens     | 1,500 tokens   |

### Vault Sustainability

With 95,000 tokens in rewards pool:

| Vault | If 100 users deposit 10k each | Days Until Empty |
| ----- | ----------------------------- | ---------------- |
| USDT  | Total deposits: 1M tokens     | ~192 days        |
| USDC  | Total deposits: 1M tokens     | ~289 days        |
| DAI   | Total deposits: 1M tokens     | ~231 days        |

## Frontend Integration

After deployment, update your frontend config:

```typescript
// frontend/lib/contracts.ts
export const CONTRACTS = {
  vaultFactory: "0x29021eaeb230bc84120c0f05fdd83c446270c4f7",

  tokens: {
    usdt: "0x...", // From deployment output
    usdc: "0x...", // From deployment output
    dai: "0x...", // From deployment output
  },

  vaults: {
    usdt: {
      address: "0x...", // From deployment output
      name: "High Yield USDT Vault",
      symbol: "hyUSDT",
      apy: 18,
      token: "0x...", // USDT address
    },
    usdc: {
      address: "0x...",
      name: "Stable USDC Vault",
      symbol: "sUSDC",
      apy: 12,
      token: "0x...", // USDC address
    },
    dai: {
      address: "0x...",
      name: "Optimized DAI Vault",
      symbol: "opDAI",
      apy: 15,
      token: "0x...", // DAI address
    },
  },
};
```

## Next Steps

1. ✅ **Deploy**: Run `./deploy-vaults.sh`
2. 📝 **Save Addresses**: Copy token and vault addresses from output
3. 🔍 **Verify**: Check deployments on Hedera explorer
4. 🎨 **Update Frontend**: Add addresses to frontend config
5. 🧪 **Test**: Deposit, withdraw, claim rewards
6. 📊 **Monitor**: Track vault health and rewards pool

## Advantages of This Approach

1. ✅ **Separate Tokens**: Each vault has its own token (realistic)
2. ✅ **No Pre-Minting**: Tokens created fresh on deployment
3. ✅ **Clean State**: No leftover test tokens from previous deployments
4. ✅ **Testing Funds**: 900K tokens left for testing deposits
5. ✅ **Realistic Setup**: Mimics production environment
6. ✅ **Self-Contained**: One script does everything

## Support

- 📖 [Full Deployment Guide](./VAULT_DEPLOYMENT_GUIDE.md)
- 🚀 [Quick Start](./VAULT_QUICK_START.md)
- 📋 [Main README](./README_VAULTS.md)
