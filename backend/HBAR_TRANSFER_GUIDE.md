# HBAR Transfer Guide

Complete guide for sending and transferring HBAR tokens using the Hedera SDK integration.

## 🎯 Features

- ✅ **Send HBAR** - Receive HBAR from operator account (for testing/funding)
- ✅ **Transfer HBAR** - Send HBAR to any Hedera account (P2P)
- ✅ **Get Balance** - Check real-time HBAR balance
- ✅ **Auto-activation** - Wallets activate automatically when funded

---

## 🔑 API Endpoints

### 1. Send HBAR to Your Wallet

**Endpoint:** `POST /api/auth/send-hbar`

**Authentication:** Required (Bearer Token)

**Description:** Sends HBAR from the operator account to your wallet. Useful for testing and funding wallets.

**Request Body:**

```json
{
  "amount": "10"
}
```

**Parameters:**

- `amount` (string, required): Amount in HBAR (e.g., "10" = 10 HBAR, "0.5" = 0.5 HBAR)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Successfully sent 10 HBAR to your wallet",
  "data": {
    "txId": "0.0.98765@1234567890.123456789",
    "wallet": {
      "accountId": "0.0.12345",
      "evmAddress": "0x1234...",
      "balance": 10,
      "isActivated": true
    }
  }
}
```

---

### 2. Transfer HBAR to Another Account

**Endpoint:** `POST /api/auth/transfer-hbar`

**Authentication:** Required (Bearer Token)

**Description:** Transfer HBAR from your wallet to any other Hedera account (P2P transfer).

**Request Body:**

```json
{
  "toAccountId": "0.0.67890",
  "amount": "5"
}
```

**Parameters:**

- `toAccountId` (string, required): Hedera account ID (format: `0.0.xxxxx`)
- `amount` (string, required): Amount in HBAR

**Success Response (200):**

```json
{
  "success": true,
  "message": "Successfully transferred 5 HBAR to 0.0.67890",
  "data": {
    "txId": "0.0.12345@1234567890.123456789",
    "from": "0.0.12345",
    "to": "0.0.67890",
    "amount": "5",
    "newBalance": 5
  }
}
```

**Error Responses:**

400 - Insufficient balance:

```json
{
  "success": false,
  "message": "Insufficient balance",
  "balance": "2.5 ℏ"
}
```

400 - Invalid account ID:

```json
{
  "success": false,
  "message": "Invalid recipient account ID"
}
```

---

### 3. Get Wallet Balance

**Endpoint:** `GET /api/auth/wallet-balance`

**Authentication:** Required (Bearer Token)

**Description:** Get real-time HBAR balance from Hedera network.

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "accountId": "0.0.12345",
    "evmAddress": "0x1234...",
    "balance": 15.5,
    "balanceString": "15.5 ℏ",
    "isActivated": true
  }
}
```

---

### 4. Fund Wallet (Legacy - Activation)

**Endpoint:** `POST /api/auth/fund-wallet`

**Authentication:** Required (Bearer Token)

**Description:** Funds wallet with the activation amount (5 HBAR by default). Only works if wallet is not already activated.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Wallet funded successfully with 5 HBAR",
  "data": {
    "txId": "0.0.98765@1234567890.123456789",
    "wallet": {
      "accountId": "0.0.12345",
      "isActivated": true,
      "balance": 5
    }
  }
}
```

---

## 🧪 Testing Examples

### Example 1: Fund Your Wallet

```bash
# Get your auth token first (from login/register)
TOKEN="your_jwt_token_here"

# Send 10 HBAR to your wallet
curl -X POST http://localhost:3000/api/auth/send-hbar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": "10"
  }'
```

### Example 2: Transfer to Another User

```bash
# Transfer 5 HBAR to account 0.0.67890
curl -X POST http://localhost:3000/api/auth/transfer-hbar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "toAccountId": "0.0.67890",
    "amount": "5"
  }'
```

### Example 3: Check Balance

```bash
# Get current balance
curl -X GET http://localhost:3000/api/auth/wallet-balance \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📋 Complete Workflow

### User-to-User Transfer Flow

```
1. Register User A → Get account ID: 0.0.12345
2. Register User B → Get account ID: 0.0.67890

3. User A sends HBAR to their wallet:
   POST /api/auth/send-hbar
   { "amount": "20" }
   → User A balance: 20 HBAR

4. User A transfers to User B:
   POST /api/auth/transfer-hbar
   { "toAccountId": "0.0.67890", "amount": "10" }
   → User A balance: 10 HBAR
   → User B balance: 10 HBAR

5. Check balances:
   GET /api/auth/wallet-balance
```

---

## 🔧 How It Works

### 1. Send HBAR (Operator → User)

```typescript
// From operator account to user's wallet
blockchainService.sendHBAR(userAccountId, amount);

// Under the hood:
TransferTransaction()
  .addHbarTransfer(operatorId, -amount)
  .addHbarTransfer(userAccountId, +amount)
  .execute(client);
```

### 2. Transfer HBAR (User → User)

```typescript
// From user's wallet to another account
blockchainService.transferHBAR(
  fromAccountId,
  fromPrivateKey, // Decrypted automatically
  toAccountId,
  amount
);

// Under the hood:
TransferTransaction()
  .addHbarTransfer(fromAccountId, -amount)
  .addHbarTransfer(toAccountId, +amount)
  .execute(userClient);
```

### 3. Balance Check

```typescript
// Real-time balance from Hedera network
blockchainService.getHBARBalance(accountId);

// Under the hood:
AccountBalanceQuery().setAccountId(accountId).execute(client);
```

---

## 💡 Important Notes

### Amount Format

Amounts are specified in HBAR, not tinybars:

- ✅ `"10"` = 10 HBAR
- ✅ `"0.5"` = 0.5 HBAR
- ✅ `"100"` = 100 HBAR
- ❌ `10000000` (this would be 10 million HBAR!)

### Account ID Format

Hedera account IDs follow the format: `shard.realm.account`

For testnet:

- ✅ `"0.0.12345"` - Correct format
- ❌ `"12345"` - Missing shard and realm
- ❌ `"0x1234..."` - EVM address, not account ID

### Transaction Fees

Hedera charges small fees for transactions:

- Transfer: ~$0.0001 USD (in HBAR)
- Balance query: Free
- Account creation: ~$0.05 USD (in HBAR)

### Network

Currently configured for **Hedera Testnet**:

- Free test HBAR available
- Use for development and testing
- Switch to mainnet for production

---

## 🔒 Security Features

### 1. Private Key Protection

- ✅ Private keys encrypted in database (AES-256-GCM)
- ✅ Keys decrypted only when needed for signing
- ✅ Never exposed in API responses
- ✅ Automatic cleanup after use

### 2. Balance Validation

- ✅ Checks balance before transfer
- ✅ Prevents overdraft
- ✅ Returns current balance on error

### 3. Input Validation

- ✅ Validates Hedera account ID format
- ✅ Checks for positive amounts
- ✅ Authenticates all requests via JWT

---

## 🚨 Error Handling

### Common Errors and Solutions

#### 1. "Insufficient balance"

**Cause:** Not enough HBAR in wallet

**Solution:**

```bash
# Send more HBAR to your wallet
POST /api/auth/send-hbar
{ "amount": "20" }
```

#### 2. "Invalid recipient account ID"

**Cause:** Wrong account ID format

**Solution:**
Use correct format: `0.0.xxxxx`

```json
{
  "toAccountId": "0.0.12345" // ✅ Correct
}
```

#### 3. "Wallet not found"

**Cause:** User not registered or wallet not created

**Solution:**
Register first:

```bash
POST /api/auth/register
```

#### 4. "Transaction failed during execution"

**Possible causes:**

- Network issues
- Insufficient operator balance (for send-hbar)
- Invalid transaction parameters

**Solution:**

- Check Hedera network status
- Ensure operator account has funds
- Validate all parameters

---

## 📊 Testing Scenarios

### Scenario 1: New User Funding

```bash
# 1. Register
POST /api/auth/register
{ "firstName": "Alice", "lastName": "Smith", "email": "alice@example.com", "password": "password123" }

# 2. Send HBAR
POST /api/auth/send-hbar
{ "amount": "10" }

# 3. Check balance
GET /api/auth/wallet-balance
# Expected: 10 HBAR
```

### Scenario 2: P2P Transfer

```bash
# User A (0.0.12345) sends to User B (0.0.67890)

# 1. User A sends HBAR to self
POST /api/auth/send-hbar (as User A)
{ "amount": "20" }

# 2. User A transfers to User B
POST /api/auth/transfer-hbar (as User A)
{ "toAccountId": "0.0.67890", "amount": "10" }

# 3. User B checks balance
GET /api/auth/wallet-balance (as User B)
# Expected: 10 HBAR
```

### Scenario 3: Multiple Transfers

```bash
# 1. Fund wallet
POST /api/auth/send-hbar
{ "amount": "100" }

# 2. Send to multiple recipients
POST /api/auth/transfer-hbar
{ "toAccountId": "0.0.11111", "amount": "10" }

POST /api/auth/transfer-hbar
{ "toAccountId": "0.0.22222", "amount": "20" }

POST /api/auth/transfer-hbar
{ "toAccountId": "0.0.33333", "amount": "30" }

# 3. Check remaining balance
GET /api/auth/wallet-balance
# Expected: 40 HBAR (100 - 10 - 20 - 30)
```

---

## 🎓 Advanced Features

### Auto-Activation

Wallets automatically activate when they receive enough HBAR:

```javascript
if (balance >= ACTIVATION_AMOUNT && !isActivated) {
  wallet.isActivated = true;
}
```

Default activation amount: **5 HBAR**

### Real-Time Balance

Balance is fetched from Hedera network in real-time:

- Not cached
- Always accurate
- Reflects latest transactions

### Transaction Tracking

All transactions return a transaction ID:

```
"txId": "0.0.12345@1234567890.123456789"
```

Use this to:

- Track transaction status on [HashScan](https://hashscan.io/testnet)
- Verify transaction completion
- Debug issues

---

## 📚 Additional Resources

- **Hedera SDK Docs:** https://docs.hedera.com/hedera/sdks-and-apis/sdks
- **Transaction Explorer:** https://hashscan.io/testnet
- **Hedera Portal:** https://portal.hedera.com
- **Testnet Faucet:** Get free test HBAR

---

## ✅ Summary

### Available Endpoints

| Endpoint                   | Method | Purpose                      |
| -------------------------- | ------ | ---------------------------- |
| `/api/auth/send-hbar`      | POST   | Receive HBAR from operator   |
| `/api/auth/transfer-hbar`  | POST   | Send HBAR to another account |
| `/api/auth/wallet-balance` | GET    | Check current HBAR balance   |
| `/api/auth/fund-wallet`    | POST   | Activate wallet (legacy)     |

### Key Features

- ✅ Real-time balance tracking
- ✅ Secure P2P transfers
- ✅ Automatic wallet activation
- ✅ Encrypted private keys
- ✅ Transaction validation
- ✅ Balance checking before transfer

---

**Ready to use!** 🚀 Start sending HBAR to your generated wallets!
