# 🏦 Vault Deployment System

A complete deployment system for creating and managing RewardVaults with different APY rates using VaultFactory.

## 📦 What I Created For You

### 1. **DeployVaults.s.sol** - Main Deployment Script

A Foundry script that deploys three RewardVaults:

- **USDT Vault**: 18% APY
- **USDC Vault**: 12% APY
- **DAI Vault**: 15% APY

**Features**:

- Automatic token approvals
- Factory fee handling
- Vault verification
- Detailed logging
- Customizable parameters

### 2. **deploy-vaults.sh** - One-Click Deployment

A bash script that automates the entire process:

- Checks token balances
- Mints tokens if needed
- Runs the deployment script
- Saves deployment addresses

### 3. **Documentation**

- `VAULT_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `VAULT_QUICK_START.md` - Quick reference and examples
- This file - Overview and summary

## 🚀 Quick Start

### Option 1: Automated (Recommended)

```bash
cd contract
./deploy-vaults.sh
```

### Option 2: Manual

```bash
cd contract

# Ensure you have tokens
forge script script/DeployVaults.s.sol:DeployVaults \
  --rpc-url $RPC_URL \
  --broadcast \
  --legacy
```

## 📋 Pre-Deployment Checklist

- [x] ✅ VaultFactory deployed: `0x29021eaeb230bc84120c0f05fdd83c446270c4f7`
- [x] ✅ MockERC20 deployed: `0xe3079a9d35a01e55e2dbd2d778e0fd3d40e426c1`
- [ ] 📝 `.env` file configured with `PRIVATE_KEY` and `RPC_URL`
- [ ] 💰 Sufficient token balance (30,000 tokens total)
- [ ] 🔧 Foundry installed and updated

## 🎯 What Each Vault Does

### USDT Vault (18% APY)

- **Purpose**: High-yield option for aggressive investors
- **APY**: 18% (1800 basis points)
- **Name**: "High Yield USDT Vault"
- **Symbol**: "hyUSDT"
- **Use Case**: Maximize returns on stable assets

### USDC Vault (12% APY)

- **Purpose**: Balanced yield for moderate risk
- **APY**: 12% (1200 basis points)
- **Name**: "Stable USDC Vault"
- **Symbol**: "sUSDC"
- **Use Case**: Steady passive income

### DAI Vault (15% APY)

- **Purpose**: Optimized returns for DAI holders
- **APY**: 15% (1500 basis points)
- **Name**: "Optimized DAI Vault"
- **Symbol**: "opDAI"
- **Use Case**: Enhanced DAI yields

## 💡 How It Works

### Deployment Flow

```
1. User runs deployment script
   ↓
2. Script approves VaultFactory to spend tokens
   ↓
3. VaultFactory.createVault() called
   ↓
4. Factory deducts 5% fee (500 tokens)
   ↓
5. Factory deploys new RewardVault contract
   ↓
6. Factory transfers 95% of tokens to vault (9,500 tokens)
   ↓
7. Vault initializes rewards pool
   ↓
8. Vault is active and ready for user deposits
```

### User Interaction Flow

```
1. User approves vault to spend their tokens
   ↓
2. User deposits tokens into vault
   ↓
3. Vault mints shares (1:1 ratio)
   ↓
4. Rewards start accruing immediately (per second)
   ↓
5. User can claim rewards anytime
   ↓
6. User can withdraw principal + unclaimed rewards
```

## 📊 Vault Parameters

| Parameter        | USDT Vault      | USDC Vault      | DAI Vault       |
| ---------------- | --------------- | --------------- | --------------- |
| APY              | 18%             | 12%             | 15%             |
| Initial Rewards  | 10,000 tokens   | 10,000 tokens   | 10,000 tokens   |
| Min Deposit      | 100 tokens      | 100 tokens      | 100 tokens      |
| Max Deposit/User | 100,000 tokens  | 100,000 tokens  | 100,000 tokens  |
| Factory Fee      | 5% (500 tokens) | 5% (500 tokens) | 5% (500 tokens) |
| Actual Rewards   | 9,500 tokens    | 9,500 tokens    | 9,500 tokens    |

## 🔧 Customization Guide

### Change APY Rates

Edit `script/DeployVaults.s.sol`:

```solidity
uint256 constant USDT_APY = 2000; // Change to 20%
uint256 constant USDC_APY = 1000; // Change to 10%
uint256 constant DAI_APY = 1800;  // Change to 18%
```

### Change Initial Rewards

```solidity
uint256 constant INITIAL_REWARDS = 50_000 * 1e18; // 50,000 tokens
```

### Change Deposit Limits

```solidity
uint256 constant MIN_DEPOSIT = 50 * 1e18;        // 50 tokens min
uint256 constant MAX_DEPOSIT_PER_USER = 0;        // No limit
```

### Use Real Mainnet Tokens

```solidity
// Replace MockERC20 with real token addresses
address constant USDT = 0x...; // Mainnet USDT
address constant USDC = 0x...; // Mainnet USDC
address constant DAI = 0x...;  // Mainnet DAI
```

## 📈 Expected Returns

### Example: User deposits 10,000 tokens

| Vault | APY | Daily Rewards | Monthly Rewards | Yearly Rewards |
| ----- | --- | ------------- | --------------- | -------------- |
| USDT  | 18% | ~4.93 tokens  | ~150 tokens     | 1,800 tokens   |
| USDC  | 12% | ~3.29 tokens  | ~100 tokens     | 1,200 tokens   |
| DAI   | 15% | ~4.11 tokens  | ~125 tokens     | 1,500 tokens   |

**Note**: Rewards compound continuously

## 🛠️ Post-Deployment Tasks

### 1. Save Deployment Addresses

After deployment, save the addresses from the output:

```bash
# Example output
USDT Vault (18% APY): 0xABC...
USDC Vault (12% APY): 0xDEF...
DAI Vault (15% APY): 0x123...
```

### 2. Verify Deployment

```bash
# Check factory registration
cast call 0x29021eaeb230bc84120c0f05fdd83c446270c4f7 \
  "isVault(address)" \
  VAULT_ADDRESS \
  --rpc-url $RPC_URL
```

### 3. Test Functionality

```bash
# Test deposit
cast send VAULT_ADDRESS \
  "deposit(uint256)" \
  100000000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy

# Check rewards after 1 minute
cast call VAULT_ADDRESS \
  "calculatePendingRewards(address)" \
  YOUR_ADDRESS \
  --rpc-url $RPC_URL
```

### 4. Update Frontend

```typescript
// Add to frontend config
export const VAULTS = {
  usdt: {
    address: "0x...", // From deployment
    name: "High Yield USDT Vault",
    apy: 18,
    token: USDT_ADDRESS,
  },
  usdc: {
    address: "0x...",
    name: "Stable USDC Vault",
    apy: 12,
    token: USDC_ADDRESS,
  },
  dai: {
    address: "0x...",
    name: "Optimized DAI Vault",
    apy: 15,
    token: DAI_ADDRESS,
  },
};
```

## 🔍 Monitoring & Management

### Check Vault Health

```bash
# Get vault health metrics
cast call VAULT_ADDRESS "getVaultHealth()" --rpc-url $RPC_URL

# Returns:
# - rewardsPoolBalance: Remaining rewards
# - projectedDailyClaims: Expected daily claims
# - daysUntilEmpty: Days until rewards depleted
```

### Add More Rewards

```bash
# As vault owner, top up rewards
cast send VAULT_ADDRESS \
  "depositRewardsPool(uint256)" \
  10000000000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy
```

### Adjust APY

```bash
# Update APY rate
cast send VAULT_ADDRESS \
  "updateAPY(uint256)" \
  2000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy
```

### Pause/Unpause Vault

```bash
# Pause in emergency
cast send VAULT_ADDRESS "pause()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy

# Resume operations
cast send VAULT_ADDRESS "unpause()" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy
```

## 📱 Contract Interfaces

### VaultFactory Interface

```solidity
interface IVaultFactory {
    function createVault(...) external returns (address);
    function getTotalVaults() external view returns (uint256);
    function getAllVaults() external view returns (address[] memory);
    function getVaultDetails(address) external view returns (...);
    function isVault(address) external view returns (bool);
}
```

### RewardVault Interface

```solidity
interface IRewardVault {
    function deposit(uint256) external;
    function withdraw(uint256) external;
    function claimRewards() external;
    function calculatePendingRewards(address) external view returns (uint256);
    function getUserInfo(address) external view returns (...);
    function getVaultStats() external view returns (...);
}
```

## 🎓 Educational Resources

### Understanding APY vs APR

- **APY** (Annual Percentage Yield): Includes compounding
- **APR** (Annual Percentage Rate): Simple interest only
- Our vaults use APY with continuous compounding

### Basis Points Explained

- 1 basis point = 0.01%
- 100 basis points = 1%
- 1000 basis points = 10%
- 10000 basis points = 100%

Examples:

- 1200 bps = 12%
- 1500 bps = 15%
- 1800 bps = 18%

## 🚨 Important Notes

### Security Considerations

1. **Factory Fee**: 5% fee on initial rewards deposit
2. **Minimum Deposit**: Set to 100 tokens (prevents spam)
3. **Maximum Deposit**: Set to 100,000 tokens per user (risk management)
4. **Owner Controls**: Only vault owner can update APY, limits, and pause

### Testnet vs Mainnet

**Testnet** (Current):

- Uses MockERC20 for all tokens
- Free test tokens via minting
- Good for testing and development

**Mainnet** (Future):

- Use real USDT, USDC, DAI addresses
- Real value at risk
- Audit contracts before deployment

## 📝 Files Reference

| File                        | Purpose                          |
| --------------------------- | -------------------------------- |
| `script/DeployVaults.s.sol` | Main deployment script           |
| `deploy-vaults.sh`          | Automated deployment bash script |
| `VAULT_DEPLOYMENT_GUIDE.md` | Complete deployment guide        |
| `VAULT_QUICK_START.md`      | Quick reference guide            |
| `README_VAULTS.md`          | This file - Overview             |

## 🆘 Troubleshooting

### Problem: Script fails with "Insufficient balance"

**Solution**: Mint more tokens first

```bash
cast send 0xe3079a9d35a01e55e2dbd2d778e0fd3d40e426c1 \
  "mint(address,uint256)" \
  YOUR_ADDRESS \
  1000000000000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy
```

### Problem: Can't deposit to vault

**Solution**: Approve vault first

```bash
cast send TOKEN_ADDRESS \
  "approve(address,uint256)" \
  VAULT_ADDRESS \
  AMOUNT \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy
```

### Problem: Rewards not showing

**Solution**: Wait a few seconds, rewards accrue per second

```bash
# Wait 60 seconds, then check
sleep 60
cast call VAULT_ADDRESS \
  "calculatePendingRewards(address)" \
  YOUR_ADDRESS \
  --rpc-url $RPC_URL
```

## 🎯 Success Criteria

After successful deployment, you should have:

- ✅ 3 deployed and verified vaults
- ✅ Each vault registered in factory
- ✅ Each vault with 9,500 tokens in rewards pool
- ✅ Each vault active and accepting deposits
- ✅ Vault addresses saved for frontend integration

## 🔗 Useful Links

- [Hedera Testnet Explorer](https://hashscan.io/testnet)
- [Foundry Documentation](https://book.getfoundry.sh/)
- [OpenZeppelin ERC20](https://docs.openzeppelin.com/contracts/4.x/erc20)

## ✨ Summary

You now have a complete deployment system for creating multiple RewardVaults with different APY rates. The system handles:

- Token approvals
- Factory interactions
- Vault deployments
- Rewards initialization
- Verification

Run `./deploy-vaults.sh` and you're ready to go! 🚀
