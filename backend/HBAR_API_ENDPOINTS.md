# HBAR Transfer API Endpoints - Quick Reference

## New HBAR Endpoints

### 1. Send HBAR to Your Wallet

```
POST /api/auth/send-hbar
```

**Request:**

```json
{
  "amount": "10"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully sent 10 HBAR to your wallet",
  "data": {
    "txId": "0.0.98765@1234567890.123456789",
    "wallet": {
      "accountId": "0.0.12345",
      "evmAddress": "0x...",
      "balance": 10,
      "isActivated": true
    }
  }
}
```

---

### 2. Transfer HBAR to Another Account

```
POST /api/auth/transfer-hbar
```

**Request:**

```json
{
  "toAccountId": "0.0.67890",
  "amount": "5"
}
```

**Response:**

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

---

### 3. Get Wallet Balance

```
GET /api/auth/wallet-balance
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accountId": "0.0.12345",
    "evmAddress": "0x...",
    "balance": 15.5,
    "balanceString": "15.5 ℏ",
    "isActivated": true
  }
}
```

---

## cURL Examples

```bash
# Send HBAR
curl -X POST http://localhost:3000/api/auth/send-hbar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": "10"}'

# Transfer HBAR
curl -X POST http://localhost:3000/api/auth/transfer-hbar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"toAccountId": "0.0.67890", "amount": "5"}'

# Get Balance
curl -X GET http://localhost:3000/api/auth/wallet-balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**See `HBAR_TRANSFER_GUIDE.md` for complete documentation.**
