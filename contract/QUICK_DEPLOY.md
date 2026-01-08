# Quick Deployment Guide

## Overview
Deploy three reward vaults (USDT, USDC, DAI) **one at a time** using already deployed tokens.

## Token Addresses (Already Deployed)
```
USDT: 0xaaa4e4EdA96fb9A9eBA3A10cC4d274c63846C81d
USDC: 0xc519BfbD99A7c3b930E74259aA41a7C229B46599
DAI:  0x0a80098112bc1B9BaC8be558C9Bd3DB8f4eB4ba6
```

## Deployment Commands

Run these commands **one at a time**, waiting for each to complete:

### 1️⃣ Deploy USDT Vault (18% APY)
```bash
cd contract
forge script script/DeployUSDTVault.s.sol:DeployUSDTVault \
  --rpc-url https://testnet.hashio.io/api \
  --broadcast \
  --legacy
```
⏸️ **WAIT** for transaction confirmation before continuing

---

### 2️⃣ Deploy USDC Vault (12% APY)
```bash
forge script script/DeployUSDCVault.s.sol:DeployUSDCVault \
  --rpc-url https://testnet.hashio.io/api \
  --broadcast \
  --legacy
```
⏸️ **WAIT** for transaction confirmation before continuing

---

### 3️⃣ Deploy DAI Vault (15% APY)
```bash
forge script script/DeployDAIVault.s.sol:DeployDAIVault \
  --rpc-url https://testnet.hashio.io/api \
  --broadcast \
  --legacy
```

---

## Requirements
- ✅ 100,000 USDT in your wallet
- ✅ 100,000 USDC in your wallet
- ✅ 100,000 DAI in your wallet
- ✅ VaultFactory deployed at `0x29021eaeb230Bc84120C0f05FDD83C446270c4f7`

## What Each Script Does
1. Checks your token balance (must have ≥100,000 tokens)
2. Approves VaultFactory to spend 100,000 tokens
3. Creates the vault with specified APY
4. Deposits 100,000 tokens as initial rewards
5. Prints the deployed vault address

## After Deployment
Save the vault addresses printed in the console and update your frontend configuration.

## Why Deploy Separately?
Deploying all three vaults at once can cause transaction issues. Sequential deployment ensures each vault is properly created and confirmed before moving to the next.

