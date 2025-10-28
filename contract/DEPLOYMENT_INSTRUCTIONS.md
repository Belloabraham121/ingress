# Vault Deployment Instructions

This guide explains how to deploy the three reward vaults (USDT, USDC, DAI) one at a time using the already deployed tokens.

## Prerequisites

✅ **Tokens Already Deployed:**

- USDT: `0xaaa4e4EdA96fb9A9eBA3A10cC4d274c63846C81d`
- USDC: `0xc519BfbD99A7c3b930E74259aA41a7C229B46599`
- DAI: `0x0a80098112bc1B9BaC8be558C9Bd3DB8f4eB4ba6`

✅ **VaultFactory Deployed:**

- Address: `0x29021eaeb230Bc84120C0f05FDD83C446270c4f7`

✅ **Required Token Balance:**

- You need at least 100,000 tokens of each (USDT, USDC, DAI) for initial rewards
- Total: 300,000 tokens across all three

## Deployment Order

Deploy vaults **one at a time** to avoid transaction issues:

### Step 1: Deploy USDT Vault (18% APY)

```bash
cd contract
forge script script/DeployUSDTVault.s.sol:DeployUSDTVault \
  --rpc-url https://testnet.hashio.io/api \
  --broadcast \
  --legacy
```

**What this does:**

- Approves VaultFactory to spend 100,000 USDT
- Creates USDT vault with 18% APY
- Deposits 100,000 USDT as initial rewards

**Wait for confirmation** before proceeding to Step 2.

---

### Step 2: Deploy USDC Vault (12% APY)

```bash
forge script script/DeployUSDCVault.s.sol:DeployUSDCVault \
  --rpc-url https://testnet.hashio.io/api \
  --broadcast \
  --legacy
```

**What this does:**

- Approves VaultFactory to spend 100,000 USDC
- Creates USDC vault with 12% APY
- Deposits 100,000 USDC as initial rewards

**Wait for confirmation** before proceeding to Step 3.

---

### Step 3: Deploy DAI Vault (15% APY)

```bash
forge script script/DeployDAIVault.s.sol:DeployDAIVault \
  --rpc-url https://testnet.hashio.io/api \
  --broadcast \
  --legacy
```

**What this does:**

- Approves VaultFactory to spend 100,000 DAI
- Creates DAI vault with 15% APY
- Deposits 100,000 DAI as initial rewards

---

## Verification

After all three vaults are deployed, verify them:

```bash
# Check total vaults in factory
cast call 0x29021eaeb230Bc84120C0f05FDD83C446270c4f7 \
  "getTotalVaults()(uint256)" \
  --rpc-url https://testnet.hashio.io/api

# Should return 3 (or more if there were previous vaults)
```

## Vault Addresses

After deployment, save the vault addresses from the console output:

```
USDT Vault (18% APY): 0x...
USDC Vault (12% APY): 0x...
DAI Vault (15% APY): 0x...
```

Update your frontend configuration with these addresses.

## Troubleshooting

### "Insufficient balance" error

- Check your token balance: `cast call <TOKEN_ADDRESS> "balanceOf(address)(uint256)" <YOUR_ADDRESS> --rpc-url https://testnet.hashio.io/api`
- You need at least 100,000 tokens for each vault

### Transaction reverts

- Ensure you're using the `--legacy` flag
- Check that VaultFactory address is correct
- Verify token addresses are correct

### "Vault already exists" error

- This means the vault was already deployed
- Check VaultFactory for existing vaults
- You can skip to the next vault

## Next Steps

Once all vaults are deployed:

1. ✅ Update frontend configuration with vault addresses
2. ✅ Test deposits in the frontend
3. ✅ Monitor vault statistics using `useVaults` hook

## Quick Commands Reference

```bash
# Deploy USDT Vault
forge script script/DeployUSDTVault.s.sol:DeployUSDTVault --rpc-url https://testnet.hashio.io/api --broadcast --legacy

# Deploy USDC Vault
forge script script/DeployUSDCVault.s.sol:DeployUSDCVault --rpc-url https://testnet.hashio.io/api --broadcast --legacy

# Deploy DAI Vault
forge script script/DeployDAIVault.s.sol:DeployDAIVault --rpc-url https://testnet.hashio.io/api --broadcast --legacy
```
