# Vault Deposit Integration - Setup Guide

This guide explains how the vault deposit functionality works and what you need to configure.

## Overview

The vault deposit system allows users to deposit tokens (USDT, USDC, DAI) into reward vaults directly from the frontend. The integration:

1. ✅ Gets the user's account ID from the backend (`GET /api/auth/me`)
2. ✅ Fetches the user's EVM address from Hedera Mirror Node
3. ✅ Approves the vault to spend tokens
4. ✅ Deposits tokens into the vault
5. ✅ Shows success/error notifications
6. ✅ Refreshes vault data after successful deposit

## Files Created

### 1. `/lib/hedera-utils.ts`

Utility functions for Hedera operations:

- `getEvmAddressFromAccountId()` - Converts Hedera account ID to EVM address via mirror node
- `isValidAccountId()` - Validates account ID format

### 2. `/hooks/useVaultDeposit.ts`

Custom React hook for vault deposits:

- Handles the entire deposit flow
- Manages loading states and errors
- Returns transaction hash on success

### 3. `/lib/contracts/RewardVault.abi.json`

ABI for the RewardVault contract (deposit, getUserInfo, etc.)

### 4. `/lib/contracts/ERC20.abi.json`

Standard ERC20 ABI (approve, balanceOf, allowance)

## Updated Files

### `/components/token-vault-selector.tsx`

- ✅ Integrated `useVaultDeposit` hook
- ✅ Added deposit error handling
- ✅ Shows toast notifications for success/failure
- ✅ Refreshes vault data after successful deposit
- ✅ Prevents modal close during deposit

## 🔐 IMPORTANT: Private Key Management

### Current Implementation (Development Only)

The current implementation expects a private key in:

```
process.env.NEXT_PUBLIC_USER_PRIVATE_KEY
```

**⚠️ WARNING: This is NOT secure for production!**

### Production Solutions

You have several options for production:

#### Option 1: MetaMask Integration (Recommended)

```typescript
// Replace the wallet creation with MetaMask
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
```

#### Option 2: WalletConnect

Integrate WalletConnect for multi-wallet support.

#### Option 3: Backend Signing

- Store encrypted private keys in the backend
- Have the backend sign transactions
- Send signed transactions to the frontend for broadcasting

#### Option 4: Hedera Wallet Connect

Use the official Hedera wallet integration for HashPack, Blade, etc.

## Testing the Deposit Flow

### Prerequisites

1. User must be logged in (JWT token in localStorage)
2. User's Hedera account must have:
   - Sufficient HBAR for gas fees (~0.01 HBAR)
   - Sufficient tokens (USDT/USDC/DAI) for the deposit amount
3. User's wallet must be activated on Hedera

### Test Steps

1. **Navigate to the Investments page**

   ```
   http://localhost:3000/investments
   ```

2. **Select a vault**

   - Choose from USDT (18% APY), USDC (12% APY), or DAI (15% APY)

3. **Enter deposit amount**

   - Minimum: 100 tokens
   - Must not exceed your token balance

4. **Click "DEPOSIT TO VAULT"**

   - Confirmation modal will appear

5. **Confirm deposit**
   - System will:
     1. Fetch your account ID from backend
     2. Get your EVM address from Hedera mirror node
     3. Approve vault to spend tokens (if needed)
     4. Execute deposit transaction
     5. Wait for confirmation
     6. Show success toast with transaction hash
     7. Refresh vault data

### Expected Console Output

```
Fetching user profile...
User account ID: 0.0.12345
Fetching EVM address from Hedera mirror node...
User EVM address: 0x1234...
Asset address: 0xd4E6...
Deposit amount (wei): 100000000000000000000
Wallet address: 0x1234...
Current allowance: 0
Approving tokens...
Approval transaction hash: 0xabc...
Waiting for approval confirmation...
Approval confirmed!
Depositing into vault...
Deposit transaction hash: 0xdef...
Waiting for deposit confirmation...
Deposit confirmed!
```

## Deployed Vault Addresses

The system uses these hardcoded vault addresses:

```typescript
const DEPLOYED_VAULTS = [
  "0x297375e521c0b864783000279faec4583a167453", // USDT Vault (18% APY)
  "0x4f2f9b9b32cd1062c1bc4c02dd7a6b8cd9eeee8c", // USDC Vault (12% APY)
  "0xcdeb6cd4b06c026fdd37fcac346b31dc90f6d084", // DAI Vault (15% APY)
];
```

## Token Addresses

```typescript
USDT: 0xd4e61131ed9c3dd610727655ae8254b286dee95c;
USDC: 0x125d3f690f281659dd7708d21688bc83ee534ae6;
DAI: 0x3814f5cf6c4aa63eddf8a79c82346a163c7e7c53;
```

## Troubleshooting

### "Private key not configured"

- Set `NEXT_PUBLIC_USER_PRIVATE_KEY` in `.env.local`
- Or implement one of the production wallet solutions above

### "Wallet address mismatch"

- The private key doesn't match the logged-in user's account
- Ensure you're using the correct private key for the logged-in account

### "Insufficient token balance"

- User doesn't have enough tokens
- Check balance with: `cast call <TOKEN_ADDRESS> "balanceOf(address)" <USER_ADDRESS>`

### "Below minimum deposit"

- Deposit amount is less than 100 tokens
- Increase the deposit amount

### "Exceeds max deposit"

- Total deposits (current + new) exceed 100,000 tokens per user
- Reduce deposit amount

## Next Steps

1. **Choose a wallet integration method** (see Production Solutions above)
2. **Test with real wallet** instead of private key environment variable
3. **Add token balance display** to show user's available tokens before deposit
4. **Add approval status** to show when tokens are being approved
5. **Add transaction history** to track all deposits

## API Flow Diagram

```
┌─────────────┐
│   User      │
│   Clicks    │
│  [DEPOSIT]  │
└──────┬──────┘
       │
       v
┌─────────────────────────────────────┐
│ 1. GET /api/auth/me                 │
│    → Returns accountId              │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│ 2. GET /api/v1/accounts/{accountId} │
│    (Hedera Mirror Node)             │
│    → Returns evm_address            │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│ 3. token.approve(vault, amount)     │
│    → Transaction hash               │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│ 4. vault.deposit(amount)            │
│    → Transaction hash               │
└──────┬──────────────────────────────┘
       │
       v
┌─────────────────────────────────────┐
│ 5. Success Toast + Refresh Vaults  │
└─────────────────────────────────────┘
```

## Security Considerations

1. **Never expose private keys** in client-side code
2. **Use proper wallet connections** (MetaMask, WalletConnect, etc.)
3. **Validate all inputs** before sending transactions
4. **Show clear transaction details** before confirmation
5. **Handle transaction failures gracefully**
6. **Log all errors** for debugging
7. **Rate limit** deposit attempts to prevent spam

---

**Ready to test!** 🚀

The deposit functionality is fully integrated and ready to use. Just set up your wallet connection method and start depositing into vaults.
