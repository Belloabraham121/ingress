# 🚀 Quick Start: Deploy Vaults

## TL;DR - Fast Deployment

```bash
cd contract
./deploy-vaults.sh
```

That's it! The script handles everything automatically.

---

## Manual Deployment (Step by Step)

### 1. Setup Environment

```bash
cd contract

# Create .env file
cat > .env << EOF
PRIVATE_KEY=your_private_key_here
RPC_URL=https://testnet.hashio.io/api
EOF
```

### 2. Check Existing Deployments

```bash
# VaultFactory is already deployed at:
FACTORY=0x29021eaeb230bc84120c0f05fdd83c446270c4f7

# MockERC20 (TEST token) is deployed at:
TOKEN=0xe3079a9d35a01e55e2dbd2d778e0fd3d40e426c1

# Verify factory
cast call $FACTORY "getTotalVaults()" --rpc-url $RPC_URL
```

### 3. Mint Test Tokens (if needed)

```bash
# Get your address
DEPLOYER=$(cast wallet address $PRIVATE_KEY)

# Check balance
cast call $TOKEN "balanceOf(address)" $DEPLOYER --rpc-url $RPC_URL

# Mint 1 million tokens if balance is low
cast send $TOKEN \
  "mint(address,uint256)" \
  $DEPLOYER \
  1000000000000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy
```

### 4. Deploy Vaults

```bash
# Simulation (dry run)
forge script script/DeployVaults.s.sol:DeployVaults \
  --rpc-url $RPC_URL

# Actual deployment
forge script script/DeployVaults.s.sol:DeployVaults \
  --rpc-url $RPC_URL \
  --broadcast \
  --legacy
```

---

## Expected Output

```
=================================================
DEPLOYING REWARD VAULTS
=================================================
Deployer: 0xE416db11FB2568434E7A86F33762E37CaCd48469
VaultFactory: 0x29021eaeb230bc84120c0f05fdd83c446270c4f7
Initial Rewards per Vault: 10000 tokens

--- Deploying USDT Vault (18% APY) ---
  Token: 0xe3079a9d35a01e55e2dbd2d778e0fd3d40e426c1
  Name: High Yield USDT Vault
  Symbol: hyUSDT
  APY: 1800 bps ( 18 . 0 %)
  Initial Rewards: 10000
  Min Deposit: 100
  Max Deposit: 100000
  Approving tokens...
  Creating vault...
  Vault created successfully!
USDT Vault deployed at: 0x...

--- Deploying USDC Vault (12% APY) ---
  Token: 0xe3079a9d35a01e55e2dbd2d778e0fd3d40e426c1
  Name: Stable USDC Vault
  Symbol: sUSDC
  APY: 1200 bps ( 12 . 0 %)
  Initial Rewards: 10000
  Min Deposit: 100
  Max Deposit: 100000
  Approving tokens...
  Creating vault...
  Vault created successfully!
USDC Vault deployed at: 0x...

--- Deploying DAI Vault (15% APY) ---
  Token: 0xe3079a9d35a01e55e2dbd2d778e0fd3d40e426c1
  Name: Optimized DAI Vault
  Symbol: opDAI
  APY: 1500 bps ( 15 . 0 %)
  Initial Rewards: 10000
  Min Deposit: 100
  Max Deposit: 100000
  Approving tokens...
  Creating vault...
  Vault created successfully!
DAI Vault deployed at: 0x...

=================================================
DEPLOYMENT SUMMARY
=================================================
USDT Vault (18% APY): 0x...
USDC Vault (12% APY): 0x...
DAI Vault (15% APY): 0x...
=================================================

NOTE: Save these addresses for frontend integration!

=================================================
VERIFICATION
=================================================
Total vaults in factory: 3
All vaults verified successfully!
=================================================
```

---

## After Deployment - Test the Vaults

### Check Vault Details

```bash
# Replace VAULT_ADDRESS with deployed vault address
VAULT=0x...

# Get vault info
cast call $VAULT "getVaultInfo()" --rpc-url $RPC_URL

# Get vault stats
cast call $VAULT "getVaultStats()" --rpc-url $RPC_URL

# Get APY
cast call $VAULT "apy()" --rpc-url $RPC_URL
```

### Test User Deposit

```bash
# 1. Approve vault to spend tokens
cast send $TOKEN \
  "approve(address,uint256)" \
  $VAULT \
  100000000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy

# 2. Deposit 100 tokens
cast send $VAULT \
  "deposit(uint256)" \
  100000000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy

# 3. Check user info
USER=$(cast wallet address $PRIVATE_KEY)
cast call $VAULT \
  "getUserInfo(address)" \
  $USER \
  --rpc-url $RPC_URL
```

### Check Pending Rewards (Real-time)

```bash
# Wait a few seconds/minutes, then check rewards
cast call $VAULT \
  "calculatePendingRewards(address)" \
  $USER \
  --rpc-url $RPC_URL

# Claim rewards
cast send $VAULT \
  "claimRewards()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy
```

---

## Deployment Addresses Cheat Sheet

| Contract             | Address                                      | Network        |
| -------------------- | -------------------------------------------- | -------------- |
| **VaultFactory**     | `0x29021eaeb230bc84120c0f05fdd83c446270c4f7` | Hedera Testnet |
| **MockERC20 (TEST)** | `0xe3079a9d35a01e55e2dbd2d778e0fd3d40e426c1` | Hedera Testnet |
| **StakingPools**     | `0xe057622f9a2479f4990ffc11aead0de40da7862a` | Hedera Testnet |
| USDT Vault (18%)     | _To be deployed_                             | Hedera Testnet |
| USDC Vault (12%)     | _To be deployed_                             | Hedera Testnet |
| DAI Vault (15%)      | _To be deployed_                             | Hedera Testnet |

---

## Customizing the Deployment

Edit `script/DeployVaults.s.sol`:

```solidity
// Change APY rates
uint256 constant USDT_APY = 1800; // 18%
uint256 constant USDC_APY = 1200; // 12%
uint256 constant DAI_APY = 1500;  // 15%

// Change initial rewards
uint256 constant INITIAL_REWARDS = 10_000 * 1e18;

// Change deposit limits
uint256 constant MIN_DEPOSIT = 100 * 1e18;
uint256 constant MAX_DEPOSIT_PER_USER = 100_000 * 1e18;

// Use different tokens (for mainnet)
address constant USDT = 0x...; // Real USDT
address constant USDC = 0x...; // Real USDC
address constant DAI = 0x...;  // Real DAI
```

---

## Common Issues & Solutions

### ❌ "Insufficient token balance"

**Solution**: Mint more tokens

```bash
cast send $TOKEN "mint(address,uint256)" $DEPLOYER 1000000000000000000000000 \
  --rpc-url $RPC_URL --private-key $PRIVATE_KEY --legacy
```

### ❌ "Below minimum deposit"

**Solution**: Ensure deposit ≥ 100 tokens

```bash
# Good: 100 tokens minimum
cast send $VAULT "deposit(uint256)" 100000000000000000000 ...

# Bad: Only 50 tokens
# cast send $VAULT "deposit(uint256)" 50000000000000000000 ...
```

### ❌ Script simulation fails

**Solution**: Check balances and approvals

```bash
# Check token balance
cast call $TOKEN "balanceOf(address)" $DEPLOYER --rpc-url $RPC_URL

# Check factory approval
cast call $TOKEN "allowance(address,address)" $DEPLOYER $FACTORY --rpc-url $RPC_URL
```

---

## What Gets Deployed

Each vault deployment creates:

1. **New RewardVault Contract**

   - ERC20 token (vault shares)
   - Deposits user funds
   - Distributes APY rewards
   - Tracks user positions

2. **Factory Registration**

   - Vault tracked in factory
   - Searchable by asset
   - Searchable by creator
   - Active by default

3. **Initial Rewards Pool**
   - 10,000 tokens deposited
   - 5% factory fee deducted (500 tokens)
   - 9,500 tokens in vault rewards pool
   - Ready to pay user rewards

---

## APY Calculations

| Vault | APY | Daily Rate | Yearly on 10k |
| ----- | --- | ---------- | ------------- |
| USDT  | 18% | 0.0493%    | 1,800 tokens  |
| USDC  | 12% | 0.0329%    | 1,200 tokens  |
| DAI   | 15% | 0.0411%    | 1,500 tokens  |

**Note**: Rewards compound continuously (calculated per second)

---

## Frontend Integration

After deployment, update your frontend config:

```typescript
// frontend/lib/contracts.ts
export const CONTRACTS = {
  vaultFactory: "0x29021eaeb230bc84120c0f05fdd83c446270c4f7",
  vaults: {
    usdt: {
      address: "0x...", // From deployment output
      apy: 18,
      token: "0xe3079a9d35a01e55e2dbd2d778e0fd3d40e426c1",
    },
    usdc: {
      address: "0x...", // From deployment output
      apy: 12,
      token: "0xe3079a9d35a01e55e2dbd2d778e0fd3d40e426c1",
    },
    dai: {
      address: "0x...", // From deployment output
      apy: 15,
      token: "0xe3079a9d35a01e55e2dbd2d778e0fd3d40e426c1",
    },
  },
};
```

---

## Next Steps

1. ✅ Deploy vaults using script
2. 📝 Save deployed addresses
3. 🧪 Test deposits/withdrawals
4. 🎨 Update frontend config
5. 📊 Monitor vault health
6. 💰 Top up rewards as needed

---

## Support & Resources

- 📖 [Full Deployment Guide](./VAULT_DEPLOYMENT_GUIDE.md)
- 📋 [VaultFactory.sol](../src/VaultFactory.sol)
- 📋 [RewardVault.sol](../src/RewardVault.sol)
- 🔗 [Hedera Testnet Explorer](https://hashscan.io/testnet)
