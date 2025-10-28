# Staking Integration with Backend Signing

## Overview

Staking now uses the same custodial wallet architecture as vault deposits:

- ✅ Backend signs all transactions
- ✅ Private keys stay secure on backend
- ✅ Users don't need wallet extensions
- ✅ Hedera SDK for transaction signing
- ✅ EVM address to Contract ID conversion

## Files Created/Modified

### Backend

1. **`backend/src/controllers/staking.controller.ts`** (NEW)

   - `signApprove()` - Approve tokens for staking pool
   - `signStake()` - Stake tokens in pool
   - `getAllowance()` - Check token allowance
   - Uses Hedera SDK for signing
   - Converts EVM addresses to Contract IDs

2. **`backend/src/routes/staking.routes.ts`** (NEW)

   - `POST /api/staking/sign-approve`
   - `POST /api/staking/sign-stake`
   - `GET /api/staking/allowance`
   - All routes require JWT authentication

3. **`backend/src/server.ts`** (MODIFIED)
   - Added staking routes registration

### Frontend

4. **`frontend/hooks/useStakingDeposit.ts`** (NEW)
   - Custom hook for staking
   - Calls backend APIs
   - No private keys on frontend
   - Similar to `useVaultDeposit`

## Backend API Endpoints

### 1. Check Allowance

**Endpoint**: `GET /api/staking/allowance`

**Query Params**:

```typescript
{
  tokenAddress: string; // ERC20 token address
  spenderAddress: string; // Staking pool address
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "allowance": "100000000000000000000",
    "formattedAllowance": "100.0"
  }
}
```

---

### 2. Approve Tokens

**Endpoint**: `POST /api/staking/sign-approve`

**Headers**:

```
Authorization: Bearer <JWT_TOKEN>
```

**Body**:

```json
{
  "tokenAddress": "0xd4E61131Ed9C3dd610727655aE8254B286deE95c",
  "spenderAddress": "0x1234...5678",
  "amount": "100000000000000000000"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Token approval successful",
  "data": {
    "transactionHash": "0.0.7149644@1761672533.166267278",
    "blockNumber": 0,
    "status": 1,
    "gasUsed": "0"
  }
}
```

---

### 3. Stake Tokens

**Endpoint**: `POST /api/staking/sign-stake`

**Headers**:

```
Authorization: Bearer <JWT_TOKEN>
```

**Body**:

```json
{
  "stakingPoolAddress": "0x1234...5678",
  "poolId": 1,
  "amount": "100000000000000000000"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Staking successful",
  "data": {
    "transactionHash": "0.0.7149644@1761672567.987654321",
    "blockNumber": 0,
    "status": 1,
    "gasUsed": "0"
  }
}
```

## Frontend Hook Usage

### Basic Usage

```typescript
import { useStakingDeposit } from "@/hooks/useStakingDeposit";

function StakingComponent() {
  const { stake, isStaking, error } = useStakingDeposit();

  const handleStake = async () => {
    const result = await stake({
      stakingPoolAddress: "0x1234...5678",
      tokenAddress: "0xd4E6...95c",
      poolId: 1,
      amount: "100", // In token units
    });

    if (result.success) {
      console.log("Stake successful:", result.txHash);
    }
  };

  return (
    <button onClick={handleStake} disabled={isStaking}>
      {isStaking ? "Staking..." : "Stake"}
    </button>
  );
}
```

### With Callbacks

```typescript
const handleStake = async () => {
  await stake({
    stakingPoolAddress: "0x1234...5678",
    tokenAddress: "0xd4E6...95c",
    poolId: 1,
    amount: "100",
    onSuccess: (txHash) => {
      toast.success(`Staked successfully! Tx: ${txHash}`);
      refreshStakingPools();
    },
    onError: (error) => {
      toast.error(`Stake failed: ${error.message}`);
    },
  });
};
```

## Integration Example

### Update Existing Staking Component

```typescript
"use client";

import { useState } from "react";
import { useStakingDeposit } from "@/hooks/useStakingDeposit";
import { useToast } from "@/hooks/use-toast";

export function StakeCard({ pool }) {
  const { stake, isStaking } = useStakingDeposit();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleStakeClick = () => {
    if (amount && parseFloat(amount) >= pool.minStake) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmStake = async () => {
    try {
      const result = await stake({
        stakingPoolAddress: pool.contractAddress, // StakingPools contract
        tokenAddress: pool.tokenAddress, // Token to stake
        poolId: pool.id,
        amount: amount,
      });

      if (result.success && result.txHash) {
        toast({
          title: "Stake Successful! ✅",
          description: (
            <div className="space-y-2">
              <p>Successfully staked {amount} tokens</p>
              <a
                href={`https://hashscan.io/testnet/transaction/${result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-primary hover:underline"
              >
                View on HashScan ↗
              </a>
            </div>
          ),
        });
        setShowConfirmation(false);
        setAmount("");
      }
    } catch (err) {
      console.error("Stake error:", err);
    }
  };

  return (
    <div className="stake-card">
      <h3>{pool.name}</h3>
      <p>APY: {pool.apy}%</p>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={`Min: ${pool.minStake}`}
      />

      <button onClick={handleStakeClick} disabled={isStaking || !amount}>
        {isStaking ? "Processing..." : "Stake"}
      </button>

      {showConfirmation && (
        <ConfirmationModal
          onConfirm={handleConfirmStake}
          onClose={() => setShowConfirmation(false)}
          isProcessing={isStaking}
        />
      )}
    </div>
  );
}
```

## Transaction Flow

### Complete Staking Flow

```
User clicks "Stake"
       ↓
Frontend: Show confirmation modal
       ↓
User clicks "Confirm"
       ↓
Frontend: Call useStakingDeposit.stake()
       ↓
Frontend: Check allowance (GET /api/staking/allowance)
       ↓
Backend: Read allowance from blockchain
       ↓
Frontend: If insufficient, approve (POST /api/staking/sign-approve)
       ↓
Backend: Decrypt user's private key
       ↓
Backend: Convert EVM address to Contract ID
       ↓
Backend: Sign approval with Hedera SDK
       ↓
Backend: Return Hedera transaction ID
       ↓
Frontend: Stake tokens (POST /api/staking/sign-stake)
       ↓
Backend: Decrypt user's private key
       ↓
Backend: Convert EVM address to Contract ID
       ↓
Backend: Sign stake transaction with Hedera SDK
       ↓
Backend: Return Hedera transaction ID
       ↓
Frontend: Show success with HashScan link
```

## Backend Implementation Details

### Gas Limits

- **Approve**: 500,000 gas
- **Stake**: 800,000 gas (higher due to complex staking logic)

### EVM Address Conversion

```typescript
function evmAddressToContractId(evmAddress: string): ContractId {
  const cleanAddress = evmAddress.startsWith("0x")
    ? evmAddress.slice(2)
    : evmAddress;
  return ContractId.fromEvmAddress(0, 0, cleanAddress);
}
```

### Transaction Signing

```typescript
// Encode stake function
const stakeInterface = new ethers.Interface([
  "function stake(uint256 poolId, uint256 amount)",
]);
const stakeData = stakeInterface.encodeFunctionData("stake", [poolId, amount]);

// Convert to Contract ID
const stakingPoolContractId = evmAddressToContractId(stakingPoolAddress);

// Sign with Hedera SDK
const transaction = new ContractExecuteTransaction()
  .setContractId(stakingPoolContractId)
  .setGas(800000)
  .setFunctionParameters(Buffer.from(stakeData.slice(2), "hex"));

const txResponse = await transaction.execute(client);
const receipt = await txResponse.getReceipt(client);

// Return Hedera transaction ID
return txResponse.transactionId.toString();
```

## Security Considerations

### ✅ Secure

- Private keys encrypted in database (AES-256-GCM)
- Keys decrypted only on backend (never exposed)
- JWT authentication required for all endpoints
- Hedera SDK used for secure signing
- EVM address fetched from mirror node

### ⚠️ Important

- This is a **custodial** system (backend holds keys)
- Users trust the platform (like Coinbase)
- Ensure HTTPS in production
- Implement rate limiting
- Monitor for suspicious transactions
- Regularly backup encrypted database

## Testing

### 1. Start Backend

```bash
cd backend
npm run dev
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

### 3. Test Staking Flow

1. Navigate to staking page
2. Select a staking pool
3. Enter amount (≥ minimum stake)
4. Click "Stake"
5. Confirm in modal
6. Wait for success
7. Click HashScan link to verify

### 4. Expected Console Output

**Frontend:**

```
==================================================
STAKING FLOW (CUSTODIAL)
==================================================
Staking Pool: 0x1234...5678
Token: 0xd4E6...95c
Pool ID: 1
Amount: 100

Step 1: Amount converted to wei: 100000000000000000000

Step 2: Checking token allowance via backend...
Current allowance: 0.0

Step 3: Insufficient allowance - requesting approval...
Backend will sign approval transaction with user's key
✅ Approval successful!
Transaction ID: 0.0.7149644@1761672533.166267278
HashScan: https://hashscan.io/testnet/transaction/0.0.7149644@1761672533.166267278

Step 4: Requesting stake...
Backend will sign stake transaction with user's key
✅ Stake successful!
Transaction ID: 0.0.7149644@1761672567.987654321
HashScan: https://hashscan.io/testnet/transaction/0.0.7149644@1761672567.987654321
==================================================
```

**Backend:**

```
User's Account ID: 0.0.7149644
User's EVM Address (from mirror node): 0x00000000000000000000000000000000006d184c
Token EVM Address: 0xd4E61131Ed9C3dd610727655aE8254B286deE95c
Token Contract ID: 0.0.8128860
Approving 100000000000000000000 tokens for staking pool 0x1234...5678...
Approval transaction sent: 0.0.7149644@1761672533.166267278
View on HashScan: https://hashscan.io/testnet/transaction/0.0.7149644@1761672533.166267278
✅ Approval confirmed!

User's Account ID: 0.0.7149644
User's EVM Address (from mirror node): 0x00000000000000000000000000000000006d184c
Staking Pool EVM Address: 0x1234...5678
Staking Pool Contract ID: 0.0.1234567
Staking 100000000000000000000 tokens in pool 1 at 0x1234...5678...
Stake transaction sent: 0.0.7149644@1761672567.987654321
View on HashScan: https://hashscan.io/testnet/transaction/0.0.7149644@1761672567.987654321
✅ Stake confirmed!
```

## Common Issues & Solutions

### Issue: "INSUFFICIENT_GAS"

**Solution**: Gas limits are already set high (500k for approve, 800k for stake)

### Issue: "failed to parse entity id"

**Solution**: Already handled - EVM addresses converted to Contract IDs

### Issue: "Insufficient token balance"

**Solution**: Ensure user has enough tokens:

```bash
# Check user balance
curl GET "http://localhost:3000/api/staking/allowance?tokenAddress=0x...&spenderAddress=0x..."
```

### Issue: "Below minimum stake"

**Solution**: Check pool's minimum stake requirement and ensure amount is sufficient

## Next Steps

### 1. Update Existing Staking Components

Replace any direct wallet connections with `useStakingDeposit` hook:

```typescript
// OLD (Direct wallet)
const handleStake = async () => {
  const signer = await provider.getSigner();
  const tx = await contract.stake(poolId, amount);
  await tx.wait();
};

// NEW (Backend signing)
const { stake } = useStakingDeposit();
const handleStake = async () => {
  await stake({
    stakingPoolAddress,
    tokenAddress,
    poolId,
    amount,
  });
};
```

### 2. Add Confirmation Modals

Create modals similar to `InvestConfirmationModal` for staking

### 3. Add Success Modals

Show transaction hash and HashScan link after successful stakes

### 4. Add Loading States

Use `isStaking` to show loading indicators

### 5. Add Error Handling

Display error messages from the hook

## API Summary

### Endpoints Created

| Method | Endpoint                    | Description           | Auth |
| ------ | --------------------------- | --------------------- | ---- |
| GET    | `/api/staking/allowance`    | Check token allowance | JWT  |
| POST   | `/api/staking/sign-approve` | Approve tokens        | JWT  |
| POST   | `/api/staking/sign-stake`   | Stake tokens          | JWT  |

### Gas Limits

- Approve: **500,000**
- Stake: **800,000**

### Transaction Format

All transactions return Hedera transaction IDs:

```
0.0.7149644@1761672533.166267278
```

Not Ethereum hashes!

## Comparison: Vault vs Staking

| Feature                | Vault Deposits            | Staking                                  |
| ---------------------- | ------------------------- | ---------------------------------------- |
| **Approval Endpoint**  | `/api/vault/sign-approve` | `/api/staking/sign-approve`              |
| **Deposit Endpoint**   | `/api/vault/sign-deposit` | `/api/staking/sign-stake`                |
| **Allowance Endpoint** | `/api/vault/allowance`    | `/api/staking/allowance`                 |
| **Frontend Hook**      | `useVaultDeposit`         | `useStakingDeposit`                      |
| **Approve Gas**        | 500,000                   | 500,000                                  |
| **Deposit Gas**        | 800,000                   | 800,000                                  |
| **Parameters**         | `vaultAddress`, `amount`  | `stakingPoolAddress`, `poolId`, `amount` |

## Summary

✅ **Backend staking controller created**  
✅ **Backend routes registered**  
✅ **Frontend hook created**  
✅ **EVM to Contract ID conversion**  
✅ **Hedera SDK transaction signing**  
✅ **JWT authentication**  
✅ **Same architecture as vault deposits**

**Staking is now fully integrated with backend signing!** 🎉

The flow is identical to vault deposits - the backend securely signs all transactions using the custodial wallet system.
