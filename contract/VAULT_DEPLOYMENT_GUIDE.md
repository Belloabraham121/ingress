# Vault Deployment Guide

This guide explains how to deploy RewardVaults using the VaultFactory contract.

## Overview

The `DeployVaults.s.sol` script:

1. **Deploys 3 separate ERC20 tokens** (USDT, USDC, DAI)
2. **Mints 1 million** of each token to the deployer
3. **Creates 3 RewardVaults** with different APYs:
   - **USDT Vault**: 18% APY (1800 basis points)
   - **USDC Vault**: 12% APY (1200 basis points)
   - **DAI Vault**: 15% APY (1500 basis points)
4. **Uses 100,000 tokens** from each token as initial rewards

## Prerequisites

### 1. VaultFactory Already Deployed ✅

The VaultFactory is already deployed at:

```
0x29021eaeb230bc84120c0f05fdd83c446270c4f7
```

### 2. No Token Balance Required! ✅

The script automatically:

- Deploys fresh USDT, USDC, and DAI tokens
- Mints 1,000,000 of each to your address
- Uses 100,000 per vault for initial rewards
- Leaves you with 900,000 tokens remaining

### 3. Environment Setup

Create a `.env` file in the `contract/` directory:

```bash
# Hedera Testnet
PRIVATE_KEY=your_private_key_here
RPC_URL=https://testnet.hashio.io/api

# Or for mainnet
# RPC_URL=https://mainnet.hashio.io/api
```

## Deployment Steps

### Step 1: Mint Test Tokens (Testnet Only)

If using the MockERC20 token on testnet, first mint tokens to your address:

```bash
cd contract

# Mint 1 million test tokens
cast send 0xe3079a9d35a01e55e2dbd2d778e0fd3d40e426c1 \
  "mint(address,uint256)" \
  YOUR_ADDRESS \
  1000000000000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Step 2: Run the Deployment Script

```bash
# Dry run (simulation)
forge script script/DeployVaults.s.sol:DeployVaults \
  --rpc-url $RPC_URL

# Actual deployment
forge script script/DeployVaults.s.sol:DeployVaults \
  --rpc-url $RPC_URL \
  --broadcast \
  --legacy
```

### Step 3: Save Deployed Addresses

The script will output the deployed vault addresses:

```
=================================================
DEPLOYMENT SUMMARY
=================================================
USDT Vault (18% APY): 0x...
USDC Vault (12% APY): 0x...
DAI Vault (15% APY): 0x...
=================================================
```

**Save these addresses!** You'll need them for:

- Frontend integration
- User interactions
- Further vault management

## Customization

### Adjust APY Rates

Edit in `DeployVaults.s.sol`:

```solidity
uint256 constant USDT_APY = 1800; // 18% (in basis points)
uint256 constant USDC_APY = 1200; // 12%
uint256 constant DAI_APY = 1500;  // 15%
```

### Adjust Initial Rewards

```solidity
uint256 constant INITIAL_REWARDS = 10_000 * 1e18; // 10,000 tokens
```

### Adjust Deposit Limits

```solidity
uint256 constant MIN_DEPOSIT = 100 * 1e18; // 100 tokens
uint256 constant MAX_DEPOSIT_PER_USER = 100_000 * 1e18; // 100,000 tokens
```

### Use Real Tokens (Mainnet)

Replace mock token addresses with real ones:

```solidity
// Hedera Mainnet Token Addresses (example)
address constant USDT = 0x...; // Real USDT address
address constant USDC = 0x...; // Real USDC address
address constant DAI = 0x...;  // Real DAI address
```

## Understanding the Deployment

### What Happens During Deployment

For each vault:

1. **Token Approval**: Script approves VaultFactory to spend `INITIAL_REWARDS` amount
2. **Vault Creation**: Calls `factory.createVault(...)` with parameters
3. **Factory Fee**: Factory deducts 5% fee (500 basis points configured in factory)
4. **Vault Deployed**: Factory deploys new RewardVault contract
5. **Rewards Transfer**: Remaining 95% of tokens transferred to vault as rewards pool
6. **Initialization**: Vault's rewards pool initialized

### Factory Fee Calculation

```
Factory Fee = 500 basis points = 5%
If INITIAL_REWARDS = 10,000 tokens:
  - Fee to fee recipient: 500 tokens (5%)
  - Actual vault rewards: 9,500 tokens (95%)
```

### Vault Parameters Explained

| Parameter               | Description                   | Example                 |
| ----------------------- | ----------------------------- | ----------------------- |
| `asset`                 | Token address (USDT/USDC/DAI) | `0xe3079...`            |
| `name`                  | Vault share token name        | "High Yield USDT Vault" |
| `symbol`                | Vault share token symbol      | "hyUSDT"                |
| `apy`                   | APY in basis points           | 1800 = 18%              |
| `initialRewardsDeposit` | Rewards you deposit           | 10,000 tokens           |
| `minDeposit`            | Minimum user deposit          | 100 tokens              |
| `maxDepositPerUser`     | Max per user (0 = unlimited)  | 100,000 tokens          |

## After Deployment

### Verify Deployment

```bash
# Check total vaults in factory
cast call 0x29021eaeb230bc84120c0f05fdd83c446270c4f7 \
  "getTotalVaults()" \
  --rpc-url $RPC_URL

# Check if vault is registered
cast call 0x29021eaeb230bc84120c0f05fdd83c446270c4f7 \
  "isVault(address)" \
  YOUR_VAULT_ADDRESS \
  --rpc-url $RPC_URL
```

### Get Vault Details

```bash
cast call 0x29021eaeb230bc84120c0f05fdd83c446270c4f7 \
  "getVaultDetails(address)" \
  YOUR_VAULT_ADDRESS \
  --rpc-url $RPC_URL
```

### Test User Deposit

```bash
# 1. Approve vault to spend tokens
cast send TOKEN_ADDRESS \
  "approve(address,uint256)" \
  VAULT_ADDRESS \
  1000000000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# 2. Deposit tokens
cast send VAULT_ADDRESS \
  "deposit(uint256)" \
  1000000000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

## Troubleshooting

### Error: "Insufficient token balance"

**Solution**: Mint more test tokens or reduce `INITIAL_REWARDS`

```bash
cast send 0xe3079a9d35a01e55e2dbd2d778e0fd3d40e426c1 \
  "mint(address,uint256)" \
  YOUR_ADDRESS \
  1000000000000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Error: "Fee too high"

**Solution**: Check factory fee is ≤ 10% (1000 basis points)

### Error: "Invalid APY"

**Solution**: APY must be between 1 and 10000 basis points (0.01% - 100%)

## Next Steps

1. **Frontend Integration**: Use deployed addresses in your React app
2. **Add More Rewards**: Call `depositRewardsPool()` to top up rewards
3. **Update APY**: Call `updateAPY()` as vault owner to adjust rates
4. **Monitor Vault**: Use `getVaultHealth()` to check rewards sustainability

## Useful Commands

```bash
# Get all vaults
cast call 0x29021eaeb230bc84120c0f05fdd83c446270c4f7 \
  "getAllVaults()" \
  --rpc-url $RPC_URL

# Get vaults by asset
cast call 0x29021eaeb230bc84120c0f05fdd83c446270c4f7 \
  "getVaultsByAsset(address)" \
  TOKEN_ADDRESS \
  --rpc-url $RPC_URL

# Get vault stats
cast call VAULT_ADDRESS \
  "getVaultStats()" \
  --rpc-url $RPC_URL
```

## Contract Addresses Reference

| Contract         | Address                                      | Network        |
| ---------------- | -------------------------------------------- | -------------- |
| VaultFactory     | `0x29021eaeb230bc84120c0f05fdd83c446270c4f7` | Hedera Testnet |
| MockERC20 (TEST) | `0xe3079a9d35a01e55e2dbd2d778e0fd3d40e426c1` | Hedera Testnet |
| USDT Vault       | _Deploy with script_                         | -              |
| USDC Vault       | _Deploy with script_                         | -              |
| DAI Vault        | _Deploy with script_                         | -              |

## Additional Resources

- [VaultFactory Contract](../src/VaultFactory.sol)
- [RewardVault Contract](../src/RewardVault.sol)
- [Deployment Log](../broadcast/Deploy.s.sol/296/run-latest.json)
