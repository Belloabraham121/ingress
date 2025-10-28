# 🏗️ Vault System Architecture

## Complete Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT SCRIPT                            │
│                   (DeployVaults.s.sol)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─── STEP 1: Deploy Tokens
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌────────┐            ┌────────┐            ┌────────┐
   │  USDT  │            │  USDC  │            │  DAI   │
   │ Token  │            │ Token  │            │ Token  │
   └────────┘            └────────┘            └────────┘
        │                     │                     │
        │ Mint 1M             │ Mint 1M             │ Mint 1M
        ▼                     ▼                     ▼
   [Deployer]            [Deployer]            [Deployer]
   900K left             900K left             900K left
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ├─── STEP 2: Deploy Vaults
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ USDT Vault   │      │ USDC Vault   │      │ DAI Vault    │
│ (18% APY)    │      │ (12% APY)    │      │ (15% APY)    │
├──────────────┤      ├──────────────┤      ├──────────────┤
│ Rewards: 95K │      │ Rewards: 95K │      │ Rewards: 95K │
│ (after fee)  │      │ (after fee)  │      │ (after fee)  │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  VaultFactory    │
                    │  (Pre-deployed)  │
                    │  Fee: 5%         │
                    └──────────────────┘
```

## Component Details

### 1. Tokens (MockERC20)

```
┌────────────────────────────┐
│     USDT Token             │
├────────────────────────────┤
│ Name: Tether USD           │
│ Symbol: USDT               │
│ Decimals: 18               │
│ Total Supply: 1,000,000    │
│                            │
│ Holder: Deployer (900K)    │
│ Vault: USDT Vault (100K)   │
└────────────────────────────┘

┌────────────────────────────┐
│     USDC Token             │
├────────────────────────────┤
│ Name: USD Coin             │
│ Symbol: USDC               │
│ Decimals: 18               │
│ Total Supply: 1,000,000    │
│                            │
│ Holder: Deployer (900K)    │
│ Vault: USDC Vault (100K)   │
└────────────────────────────┘

┌────────────────────────────┐
│     DAI Token              │
├────────────────────────────┤
│ Name: Dai Stablecoin       │
│ Symbol: DAI                │
│ Decimals: 18               │
│ Total Supply: 1,000,000    │
│                            │
│ Holder: Deployer (900K)    │
│ Vault: DAI Vault (100K)    │
└────────────────────────────┘
```

### 2. Vaults (RewardVault)

```
┌──────────────────────────────────────┐
│     USDT Vault (hyUSDT)              │
├──────────────────────────────────────┤
│ Asset: USDT Token                    │
│ APY: 18% (1800 basis points)         │
│ Owner: Deployer                      │
│                                      │
│ Rewards Pool: 95,000 USDT            │
│ (100K - 5% factory fee)              │
│                                      │
│ Min Deposit: 100 USDT                │
│ Max Deposit: 100,000 USDT/user       │
│                                      │
│ Features:                            │
│ - Real-time APY (per second)         │
│ - Instant deposits/withdrawals       │
│ - Claim rewards anytime              │
│ - Pausable by owner                  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│     USDC Vault (sUSDC)               │
├──────────────────────────────────────┤
│ Asset: USDC Token                    │
│ APY: 12% (1200 basis points)         │
│ Owner: Deployer                      │
│                                      │
│ Rewards Pool: 95,000 USDC            │
│ (100K - 5% factory fee)              │
│                                      │
│ Min Deposit: 100 USDC                │
│ Max Deposit: 100,000 USDC/user       │
│                                      │
│ Features:                            │
│ - Real-time APY (per second)         │
│ - Instant deposits/withdrawals       │
│ - Claim rewards anytime              │
│ - Pausable by owner                  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│     DAI Vault (opDAI)                │
├──────────────────────────────────────┤
│ Asset: DAI Token                     │
│ APY: 15% (1500 basis points)         │
│ Owner: Deployer                      │
│                                      │
│ Rewards Pool: 95,000 DAI             │
│ (100K - 5% factory fee)              │
│                                      │
│ Min Deposit: 100 DAI                 │
│ Max Deposit: 100,000 DAI/user        │
│                                      │
│ Features:                            │
│ - Real-time APY (per second)         │
│ - Instant deposits/withdrawals       │
│ - Claim rewards anytime              │
│ - Pausable by owner                  │
└──────────────────────────────────────┘
```

### 3. VaultFactory (Pre-deployed)

```
┌──────────────────────────────────────────┐
│         VaultFactory                     │
│  0x29021eaeb230bc84120c0f05fdd83c446... │
├──────────────────────────────────────────┤
│ Factory Owner: Original Deployer         │
│ Factory Fee: 500 bps (5%)                │
│ Fee Recipient: Factory Owner             │
│                                          │
│ Total Vaults: 3 (after deployment)       │
│                                          │
│ Functions Used:                          │
│ - createVault() → Deploy new vaults      │
│ - getTotalVaults() → Query count         │
│ - getVaultDetails() → Query info         │
│ - isVault() → Verify registration        │
└──────────────────────────────────────────┘
```

## User Interaction Flow

```
┌─────────┐
│  USER   │
└────┬────┘
     │
     │ 1. Approve vault to spend tokens
     ▼
┌──────────┐
│  Token   │ ────────┐
│ Contract │         │ Approval granted
└──────────┘         │
                     ▼
                ┌─────────┐
                │  Vault  │
                │Contract │
                └────┬────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
     ▼               ▼               ▼
  Deposit        Withdraw        Claim
  Tokens         Tokens         Rewards
     │               │               │
     ▼               ▼               ▼
Receive         Get back        Receive
Shares          Principal       Earned
(1:1)           + Shares        Rewards
```

## Detailed User Flow Example

### Deposit Flow

```
1. User has 1,000 USDT
   │
   ├─► Approves USDT Vault to spend 1,000 USDT
   │
   ├─► Calls vault.deposit(1000 * 1e18)
   │
   ├─► Vault transfers 1,000 USDT from user
   │
   ├─► Vault mints 1,000 hyUSDT shares to user
   │
   └─► Rewards start accruing immediately
       (18% APY, calculated per second)
```

### Rewards Accrual (Real-time)

```
Time: 0s
├─ Deposit: 1,000 USDT
├─ Shares: 1,000 hyUSDT
└─ Pending Rewards: 0 USDT

Time: 60s (1 minute)
├─ Deposit: 1,000 USDT
├─ Shares: 1,000 hyUSDT
└─ Pending Rewards: ~0.000342 USDT

Time: 3600s (1 hour)
├─ Deposit: 1,000 USDT
├─ Shares: 1,000 hyUSDT
└─ Pending Rewards: ~0.0205 USDT

Time: 86400s (1 day)
├─ Deposit: 1,000 USDT
├─ Shares: 1,000 hyUSDT
└─ Pending Rewards: ~0.493 USDT

Time: 2592000s (30 days)
├─ Deposit: 1,000 USDT
├─ Shares: 1,000 hyUSDT
└─ Pending Rewards: ~15 USDT

Time: 31536000s (1 year)
├─ Deposit: 1,000 USDT
├─ Shares: 1,000 hyUSDT
└─ Pending Rewards: ~180 USDT
```

### Withdrawal Flow

```
1. User has 1,000 USDT deposited + pending rewards
   │
   ├─► Calls vault.withdraw(1000 * 1e18)
   │
   ├─► Vault automatically claims pending rewards first
   │
   ├─► User receives pending rewards (e.g., 0.5 USDT)
   │
   ├─► Vault burns 1,000 hyUSDT shares
   │
   └─► User receives 1,000 USDT principal

       Total received: 1,000.5 USDT
```

## Factory Fee Flow

```
User deposits 100,000 tokens as initial rewards
              │
              ▼
┌──────────────────────────┐
│    VaultFactory          │
│                          │
│  Calculates fee:         │
│  100,000 × 5% = 5,000    │
│                          │
│  Remaining: 95,000       │
└─────────┬────────────────┘
          │
          ├─► 5,000 → Fee Recipient
          │
          └─► 95,000 → Vault Rewards Pool
```

## System Interactions

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │
       │ Read: getVaultInfo(), getUserInfo(), etc.
       │ Write: deposit(), withdraw(), claimRewards()
       │
       ▼
┌──────────────────────────────────────┐
│         Smart Contracts              │
├──────────────────────────────────────┤
│                                      │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ VaultFactory │  │ RewardVault  │ │
│  │              │  │   (USDT)     │ │
│  │ - Create     │◄─┤              │ │
│  │ - Track      │  │ - Deposit    │ │
│  │ - Query      │  │ - Withdraw   │ │
│  └──────────────┘  │ - Claim      │ │
│                    └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐ │
│  │   MockERC20  │  │ RewardVault  │ │
│  │   (USDT)     │  │   (USDC)     │ │
│  │              │  └──────────────┘ │
│  │ - Transfer   │  ┌──────────────┐ │
│  │ - Approve    │  │ RewardVault  │ │
│  │ - Balance    │  │   (DAI)      │ │
│  └──────────────┘  └──────────────┘ │
│                                      │
└──────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│  Hedera      │
│  Testnet     │
└──────────────┘
```

## Security Model

```
┌─────────────────────────────────────┐
│         Access Control              │
├─────────────────────────────────────┤
│                                     │
│ VaultFactory:                       │
│ ├─ Only factory owner can:          │
│ │  - Update factory fee             │
│ │  - Update fee recipient           │
│ │  - Deactivate vaults              │
│ │                                   │
│ └─ Anyone can:                      │
│    - Create vaults (with tokens)    │
│    - Query vault info               │
│                                     │
│ RewardVault:                        │
│ ├─ Only vault owner can:            │
│ │  - Update APY                     │
│ │  - Update limits                  │
│ │  - Pause/unpause                  │
│ │  - Deposit more rewards           │
│ │                                   │
│ └─ Any user can:                    │
│    - Deposit tokens                 │
│    - Withdraw tokens                │
│    - Claim rewards                  │
│    - Query balances                 │
└─────────────────────────────────────┘
```

## Gas Optimization

```
Deployment (one-time):
├─ Deploy Token: ~800K gas
├─ Mint Tokens: ~50K gas
└─ Deploy Vault: ~2.5M gas

User Operations (recurring):
├─ Approve: ~45K gas
├─ Deposit: ~150K gas
├─ Withdraw: ~180K gas (includes claim)
├─ Claim Rewards: ~80K gas
└─ View Functions: FREE (off-chain)
```

## Summary

This architecture provides:

✅ **Modular Design**: Separate tokens and vaults
✅ **Scalable**: Easy to add more vaults
✅ **Secure**: Access control and pausability
✅ **Efficient**: Optimized gas usage
✅ **Transparent**: All data on-chain and queryable
✅ **User-Friendly**: Simple deposit/withdraw/claim flow
✅ **Real-time Rewards**: APY calculated every second
✅ **Sustainable**: Rewards pool management
