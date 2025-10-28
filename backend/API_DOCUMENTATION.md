# Ingress API Documentation

Complete API reference for the Ingress backend system with Hedera Blockchain integration and Paystack virtual bank accounts.

## Base URL

```
Development: http://localhost:3000
Production: https://your-production-domain.com
```

## Authentication

Most endpoints require a JWT token obtained from registration or login. Include it in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Token Expiration:** 7 days (configurable)

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
   - Register User
   - Login User
   - Get Current User Profile
   - Fund Wallet
2. [Bank Account Endpoints](#bank-account-endpoints)
   - Create Bank Account
   - Get Bank Account Details
   - Get Account Balance
   - Get Available Banks
3. [Webhook Endpoints](#webhook-endpoints)
   - Paystack Webhook
   - Get Transaction History
4. [Response Format](#response-format)
5. [Testing Examples](#testing-examples)

---

## Authentication Endpoints

### 1. Health Check

Check if the API server is running.

**Endpoint**: `GET /`

**Authentication**: None

**Response**:

```json
{
  "success": true,
  "message": "Ingress API Server",
  "version": "1.0.0"
}
```

---

### 2. Register User

Create a new user account and generate a Hedera wallet automatically.

**Endpoint**: `POST /api/auth/register`

**Authentication**: None

**Request Body**:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation**:

- `firstName`: Required, string, trimmed
- `lastName`: Required, string, trimmed
- `email`: Required, valid email format, unique
- `password`: Required, minimum 6 characters

**Success Response** (201):

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1N...",
    "user": {
      "id": "6579abc123def456789",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "wallet": {
      "accountId": "0.0.12345",
      "evmAddress": "0x1234567890abcdef1234567890abcdef12345678",
      "isActivated": false,
      "balance": 0,
      "activationRequired": "5"
    }
  }
}
```

**Error Responses**:

400 - Missing fields:

```json
{
  "success": false,
  "message": "Please provide first name, last name, email, and password"
}
```

400 - User already exists:

```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

500 - Server error:

```json
{
  "success": false,
  "message": "Error registering user",
  "error": "Detailed error message"
}
```

---

### 3. Login User

Authenticate an existing user.

**Endpoint**: `POST /api/auth/login`

**Authentication**: None

**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation**:

- `email`: Required, valid email format
- `password`: Required

**Success Response** (200):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1N...",
    "user": {
      "id": "6579abc123def456789",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "wallet": {
      "accountId": "0.0.12345",
      "evmAddress": "0x1234567890abcdef1234567890abcdef12345678",
      "isActivated": true,
      "balance": 5.5,
      "activationRequired": 0
    }
  }
}
```

**Error Responses**:

400 - Missing fields:

```json
{
  "success": false,
  "message": "Please provide email and password"
}
```

401 - Invalid credentials:

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

404 - Wallet not found:

```json
{
  "success": false,
  "message": "Wallet not found for this user"
}
```

---

### 4. Get Current User Profile

Retrieve the authenticated user's profile and wallet information.

**Endpoint**: `GET /api/auth/me`

**Authentication**: Required (Bearer token)

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "6579abc123def456789",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "wallet": {
      "accountId": "0.0.12345",
      "evmAddress": "0x1234567890abcdef1234567890abcdef12345678",
      "isActivated": true,
      "balance": 5.5
    }
  }
}
```

**Error Responses**:

401 - No token provided:

```json
{
  "success": false,
  "message": "Not authorized to access this route - no token provided"
}
```

401 - Invalid token:

```json
{
  "success": false,
  "message": "Not authorized to access this route - invalid token"
}
```

404 - User not found:

```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 5. Fund Wallet (Activate)

Fund the user's wallet with the activation amount (5 HBAR) to activate it.

**Endpoint**: `POST /api/auth/fund-wallet`

**Authentication**: Required (Bearer token)

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Request Body**: None

**Success Response** (200):

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

**Error Responses**:

400 - Wallet already activated:

```json
{
  "success": false,
  "message": "Wallet is already activated"
}
```

404 - Wallet not found:

```json
{
  "success": false,
  "message": "Wallet not found"
}
```

500 - Funding failed:

```json
{
  "success": false,
  "message": "Failed to fund wallet: Insufficient operator balance"
}
```

---

## Bank Account Endpoints

All bank account endpoints require authentication. Users must be registered and logged in to create or access bank accounts.

### 6. Create Bank Account

Create a dedicated virtual bank account using BVN (Bank Verification Number).

**Endpoint**: `POST /api/bank-account/create`

**Authentication**: Required (Bearer token)

**Headers**:

```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "bvn": "12345678901",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "08012345678",
  "preferredBank": "test-bank"
}
```

**Note:** For testing, always use `"preferredBank": "test-bank"`. Production banks (`wema-bank`, `titan-paystack`) require approval from Paystack.

**Validation**:

- `bvn`: Required, exactly 11 digits (use `12345678901` for testing)
- `firstName`: Required, string
- `lastName`: Required, string
- `phone`: Required, valid Nigerian phone number format
- `preferredBank`: Optional, use `"test-bank"` for testing (default), `"wema-bank"` or `"titan-paystack"` for production (requires Paystack approval)

**Phone Number Formats Accepted**:

- `08012345678` ✅
- `09012345678` ✅
- `07012345678` ✅
- `+2348012345678` ✅

**Success Response** (201):

```json
{
  "success": true,
  "message": "Bank account created successfully",
  "data": {
    "accountNumber": "9876543210",
    "accountName": "John Doe",
    "bankName": "Wema Bank",
    "currency": "NGN",
    "isActive": true,
    "instructions": "Transfer money to this account to fund your wallet"
  }
}
```

**Error Responses**:

400 - Missing required fields:

```json
{
  "success": false,
  "message": "Please provide BVN, first name, last name, and phone number"
}
```

400 - Invalid BVN format:

```json
{
  "success": false,
  "message": "Invalid BVN format. BVN must be 11 digits"
}
```

400 - Invalid phone number:

```json
{
  "success": false,
  "message": "Invalid phone number format. Use Nigerian phone number format"
}
```

400 - Account already exists:

```json
{
  "success": false,
  "message": "You already have a bank account",
  "data": {
    "accountNumber": "9876543210",
    "accountName": "John Doe",
    "bankName": "Wema Bank"
  }
}
```

401 - Not authenticated:

```json
{
  "success": false,
  "message": "Not authorized to access this route - no token provided"
}
```

500 - Paystack error:

```json
{
  "success": false,
  "message": "Failed to create dedicated virtual account",
  "error": "Paystack error message"
}
```

---

### 7. Get Bank Account Details

Retrieve the authenticated user's bank account information.

**Endpoint**: `GET /api/bank-account/details`

**Authentication**: Required (Bearer token)

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "accountNumber": "9876543210",
    "accountName": "John Doe",
    "bankName": "Wema Bank",
    "currency": "NGN",
    "balance": 50000.0,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses**:

404 - No bank account found:

```json
{
  "success": false,
  "message": "No bank account found. Please create one first"
}
```

---

### 8. Get Account Balance

Check the current balance of the user's bank account.

**Endpoint**: `GET /api/bank-account/balance`

**Authentication**: Required (Bearer token)

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "balance": 50000.0,
    "currency": "NGN"
  }
}
```

**Error Responses**:

404 - No bank account found:

```json
{
  "success": false,
  "message": "No bank account found"
}
```

---

### 9. Get Available Banks

Get a list of banks available for virtual account creation.

**Endpoint**: `GET /api/bank-account/banks`

**Authentication**: Required (Bearer token)

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "name": "Test Bank (Testing Only)",
      "code": "test-bank",
      "slug": "test-bank",
      "description": "Use this for testing with test API keys"
    },
    {
      "name": "Wema Bank",
      "code": "wema-bank",
      "slug": "wema-bank",
      "description": "Production only - requires Paystack approval"
    },
    {
      "name": "Titan (Paystack)",
      "code": "titan-paystack",
      "slug": "titan-paystack",
      "description": "Production only - requires Paystack approval"
    }
  ]
}
```

---

## Webhook Endpoints

### 10. Paystack Webhook

Receive payment notifications from Paystack. This endpoint is called by Paystack, not by your frontend.

**Endpoint**: `POST /api/webhook/paystack`

**Authentication**: Signature verification (automatic)

**Note**: This endpoint is public but secured with HMAC SHA512 signature verification. Do not call this from your frontend.

**Headers** (sent by Paystack):

```
X-Paystack-Signature: <hmac_signature>
Content-Type: application/json
```

**Webhook Events Handled**:

- `charge.success` - Payment received (balance updated automatically)
- `transfer.success` - Transfer completed
- `transfer.failed` - Transfer failed
- `dedicatedaccount.assign.success` - Virtual account created
- `dedicatedaccount.assign.failed` - Virtual account creation failed

**Response** (200):

```json
{
  "success": true,
  "message": "Webhook processed"
}
```

---

### 11. Get Transaction History

Retrieve the authenticated user's transaction history with pagination.

**Endpoint**: `GET /api/webhook/transactions`

**Authentication**: Required (Bearer token)

**Headers**:

```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters**:

| Parameter | Type   | Default | Description                               |
| --------- | ------ | ------- | ----------------------------------------- |
| `limit`   | number | 50      | Number of transactions per page (max 100) |
| `page`    | number | 1       | Page number                               |

**Example**: `/api/webhook/transactions?limit=10&page=1`

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "reference": "txn_abc123xyz",
        "amount": 50000.0,
        "currency": "NGN",
        "status": "success",
        "channel": "dedicated_nuban",
        "paidAt": "2024-01-15T10:30:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "reference": "txn_def456uvw",
        "amount": 25000.0,
        "currency": "NGN",
        "status": "success",
        "channel": "dedicated_nuban",
        "paidAt": "2024-01-14T15:20:00.000Z",
        "createdAt": "2024-01-14T15:20:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  }
}
```

**Transaction Status Values**:

- `pending` - Transaction initiated but not confirmed
- `success` - Transaction completed successfully
- `failed` - Transaction failed

---

## Response Format

All API responses follow this general format:

### Success Response

```json
{
  "success": true,
  "message": "Descriptive success message",
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Descriptive error message",
  "error": "Detailed error information (optional)"
}
```

---

## Status Codes

| Code | Description                          |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 201  | Created (successful registration)    |
| 400  | Bad Request (validation error)       |
| 401  | Unauthorized (authentication failed) |
| 404  | Not Found                            |
| 500  | Internal Server Error                |

---

## Wallet States

### Not Activated

```json
{
  "isActivated": false,
  "balance": 0,
  "activationRequired": "5"
}
```

User needs to call `/api/auth/fund-wallet` to activate their wallet.

### Activated

```json
{
  "isActivated": true,
  "balance": 5.5,
  "activationRequired": 0
}
```

Wallet is ready for transactions.

---

## Common Workflows

### 1. New User Registration Flow

```
1. POST /api/auth/register
   → Receive JWT token + Hedera wallet info

2. POST /api/auth/fund-wallet (optional)
   → Activate Hedera wallet with 5 HBAR

3. POST /api/bank-account/create
   → Create virtual bank account with BVN
   → Receive account number for funding

4. User transfers money to account number
   → Webhook automatically updates balance

5. GET /api/bank-account/balance
   → Check updated balance

6. GET /api/webhook/transactions
   → View transaction history
```

### 2. Existing User Login Flow

```
1. POST /api/auth/login
   → Receive JWT token + wallet info

2. GET /api/auth/me
   → Get latest profile + Hedera wallet balance

3. GET /api/bank-account/details
   → Get virtual bank account info (if created)

4. GET /api/bank-account/balance
   → Get current NGN balance

5. GET /api/webhook/transactions
   → View recent transactions
```

### 3. Bank Account Creation Flow

```
1. User must be registered and logged in
   → Have valid JWT token

2. GET /api/bank-account/banks
   → Get available banks (optional)

3. POST /api/bank-account/create
   → Provide BVN, name, phone
   → Receive dedicated account number

4. Share account number with user
   → User can transfer money from any bank

5. Payment notification via webhook
   → Balance updated automatically

6. GET /api/bank-account/balance
   → Confirm payment received
```

---

## Testing with cURL

### Register a new user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "password": "securepassword"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "securepassword"
  }'
```

### Get profile (replace TOKEN)

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Fund wallet (replace TOKEN)

```bash
curl -X POST http://localhost:3000/api/auth/fund-wallet \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create bank account (replace TOKEN)

```bash
curl -X POST http://localhost:3000/api/bank-account/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "bvn": "12345678901",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "08012345678",
    "preferredBank": "test-bank"
  }'
```

### Get bank account details (replace TOKEN)

```bash
curl http://localhost:3000/api/bank-account/details \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get account balance (replace TOKEN)

```bash
curl http://localhost:3000/api/bank-account/balance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get transaction history (replace TOKEN)

```bash
curl "http://localhost:3000/api/webhook/transactions?limit=10&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Testing with JavaScript/Fetch

### Register

```javascript
const response = await fetch("http://localhost:3000/api/auth/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    password: "securepassword",
  }),
});

const data = await response.json();
const token = data.data.token;
// Store token securely (e.g., localStorage, sessionStorage, or httpOnly cookie)
localStorage.setItem("authToken", token);
```

### Login

```javascript
const response = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "jane@example.com",
    password: "securepassword",
  }),
});

const data = await response.json();
const token = data.data.token;
```

### Get Profile

```javascript
const response = await fetch("http://localhost:3000/api/auth/me", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
```

### Fund Wallet

```javascript
const response = await fetch("http://localhost:3000/api/auth/fund-wallet", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
```

### Create Bank Account

```javascript
const response = await fetch("http://localhost:3000/api/bank-account/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    bvn: "12345678901",
    firstName: "Jane",
    lastName: "Smith",
    phone: "08012345678",
    preferredBank: "test-bank", // Use test-bank for testing
  }),
});

const data = await response.json();
console.log("Account Number:", data.data.accountNumber);
```

### Get Bank Account Details

```javascript
const response = await fetch("http://localhost:3000/api/bank-account/details", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
const { accountNumber, accountName, bankName, balance } = data.data;
```

### Get Account Balance

```javascript
const response = await fetch("http://localhost:3000/api/bank-account/balance", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
console.log("Balance:", data.data.balance, data.data.currency);
```

### Get Transaction History

```javascript
const page = 1;
const limit = 10;

const response = await fetch(
  `http://localhost:3000/api/webhook/transactions?page=${page}&limit=${limit}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const data = await response.json();
const { transactions, pagination } = data.data;

transactions.forEach((tx) => {
  console.log(`${tx.amount} ${tx.currency} - ${tx.status}`);
});

console.log(`Page ${pagination.page} of ${pagination.pages}`);
```

### Complete Frontend Integration Example

```javascript
// 1. Register user
async function registerUser(firstName, lastName, email, password) {
  const response = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstName, lastName, email, password }),
  });

  const data = await response.json();
  if (data.success) {
    localStorage.setItem("authToken", data.data.token);
    return data.data;
  }
  throw new Error(data.message);
}

// 2. Login user
async function loginUser(email, password) {
  const response = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (data.success) {
    localStorage.setItem("authToken", data.data.token);
    return data.data;
  }
  throw new Error(data.message);
}

// 3. Create bank account
async function createBankAccount(bvn, firstName, lastName, phone) {
  const token = localStorage.getItem("authToken");

  const response = await fetch(
    "http://localhost:3000/api/bank-account/create",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bvn, firstName, lastName, phone }),
    }
  );

  const data = await response.json();
  if (data.success) {
    return data.data;
  }
  throw new Error(data.message);
}

// 4. Get account details
async function getAccountDetails() {
  const token = localStorage.getItem("authToken");

  const response = await fetch(
    "http://localhost:3000/api/bank-account/details",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await response.json();
  if (data.success) {
    return data.data;
  }
  throw new Error(data.message);
}

// 5. Refresh balance
async function refreshBalance() {
  const token = localStorage.getItem("authToken");

  const response = await fetch(
    "http://localhost:3000/api/bank-account/balance",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await response.json();
  if (data.success) {
    return data.data.balance;
  }
  throw new Error(data.message);
}

// 6. Usage example
async function init() {
  try {
    // Register
    const userData = await registerUser(
      "Jane",
      "Smith",
      "jane@example.com",
      "password123"
    );
    console.log("Registered:", userData.user);

    // Create bank account
    const bankAccount = await createBankAccount(
      "12345678901",
      "Jane",
      "Smith",
      "08012345678"
    );
    console.log("Account Number:", bankAccount.accountNumber);

    // Get details
    const details = await getAccountDetails();
    console.log("Account Details:", details);

    // Refresh balance
    const balance = await refreshBalance();
    console.log("Current Balance:", balance);
  } catch (error) {
    console.error("Error:", error.message);
  }
}
```

---

## Security Considerations

1. **Always use HTTPS in production**
2. **Store JWT tokens securely** (httpOnly cookies recommended)
3. **Never expose private keys** or sensitive environment variables
4. **Implement rate limiting** for authentication endpoints
5. **Use strong passwords** (consider enforcing password complexity)
6. **Validate all input** on both client and server
7. **Monitor for suspicious activity**

---

## Rate Limiting (Recommended for Production)

Consider implementing rate limiting:

- Registration: 5 attempts per hour per IP
- Login: 10 attempts per hour per IP
- Fund wallet: 1 attempt per hour per user

---

## Frontend Integration Checklist

### Required for Registration/Login

- ✅ Collect `firstName` and `lastName` separately (not fullName)
- ✅ Store JWT token securely after registration/login
- ✅ Include token in Authorization header for all protected endpoints
- ✅ Handle token expiration (7 days default)
- ✅ Display both firstName and lastName from user object

### Required for Bank Account Feature

- ✅ Collect BVN (11 digits) from user
- ✅ Validate phone number format (Nigerian format)
- ✅ Check if user already has a bank account before creating
- ✅ Display account number prominently after creation
- ✅ Provide "Copy Account Number" functionality
- ✅ Show bank name and account name
- ✅ Poll or manually refresh balance after user makes payment
- ✅ Display transaction history with pagination
- ✅ Show payment instructions to users
- ✅ Handle errors gracefully (BVN validation, network errors)

### Recommended Features

- ✅ Auto-refresh balance every 30 seconds on account page
- ✅ Show loading states during API calls
- ✅ Display toast/notification when payment is received
- ✅ Add QR code for account number (optional)
- ✅ Export transaction history to PDF/CSV (optional)
- ✅ Show total deposits and transaction count
- ✅ Implement retry logic for failed requests

### Testing Credentials

**For Development/Testing:**

- BVN: `12345678901` (Paystack test BVN)
- Phone: Any valid Nigerian format
- Bank: **Always use `"test-bank"`** for testing with test API keys
- **Important:** Production banks require Paystack approval and live API keys

---

## API Endpoint Summary

| Endpoint                    | Method | Auth      | Description                 |
| --------------------------- | ------ | --------- | --------------------------- |
| `/`                         | GET    | No        | Health check                |
| `/api/auth/register`        | POST   | No        | Register new user           |
| `/api/auth/login`           | POST   | No        | Login user                  |
| `/api/auth/me`              | GET    | Yes       | Get user profile            |
| `/api/auth/fund-wallet`     | POST   | Yes       | Fund Hedera wallet          |
| `/api/bank-account/create`  | POST   | Yes       | Create virtual account      |
| `/api/bank-account/details` | GET    | Yes       | Get account details         |
| `/api/bank-account/balance` | GET    | Yes       | Get account balance         |
| `/api/bank-account/banks`   | GET    | Yes       | List available banks        |
| `/api/webhook/paystack`     | POST   | Signature | Paystack webhook (internal) |
| `/api/webhook/transactions` | GET    | Yes       | Get transaction history     |

---

## Error Handling Best Practices

```javascript
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, options);
    const data = await response.json();

    if (!data.success) {
      // Handle API errors
      throw new Error(data.message || "An error occurred");
    }

    return data.data;
  } catch (error) {
    // Handle network errors
    if (error.message.includes("Failed to fetch")) {
      throw new Error("Network error. Please check your connection.");
    }
    throw error;
  }
}
```

---

## Additional Notes

### Hedera Blockchain

- Balances are in HBAR (not tinybars)
- Account IDs follow Hedera format: `0.0.xxxxx`
- EVM addresses are 42 characters (0x + 40 hex chars)

### Bank Accounts

- Currency: NGN (Nigerian Naira)
- Amounts are in kobo when sent to Paystack (divide by 100 for display)
- Account numbers are unique per user
- Webhooks update balance automatically
- One bank account per user

### Security

- JWT tokens expire after 7 days (configurable)
- All timestamps are in ISO 8601 format
- Always use HTTPS in production
- Store tokens securely (httpOnly cookies recommended for production)
- Never expose API keys in frontend code
- Implement CORS properly

### Rate Limiting (Recommended for Production)

- Registration: 5 attempts/hour per IP
- Login: 10 attempts/hour per IP
- Bank account creation: 1 per user (enforced)
- Balance checks: 100/minute per user
- Transaction history: 30/minute per user

---

## Support & Documentation

- **Backend Repository**: Check README.md for setup instructions
- **Environment Variables**: See SETUP_GUIDE.md
- **Webhook Setup**: See UPDATE_SUMMARY.md
- **Paystack Documentation**: https://paystack.com/docs
- **Hedera Documentation**: https://docs.hedera.com

---

**Last Updated**: January 28, 2025
**Version**: 2.0.0
**Status**: Production Ready
