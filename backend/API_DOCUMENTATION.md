# Ingress API Documentation

Complete API reference for the Ingress backend system.

## Base URL

```
Development: http://localhost:3000
```

## Authentication

Most endpoints require a JWT token. Include it in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

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

Create a new user account and generate a Hedera wallet.

**Endpoint**: `POST /api/auth/register`

**Authentication**: None

**Request Body**:

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation**:

- `fullName`: Required, string
- `email`: Required, valid email format
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
      "fullName": "John Doe",
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
  "message": "Please provide full name, email, and password"
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
      "fullName": "John Doe",
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
      "fullName": "John Doe",
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
   → Receive JWT token + wallet info

2. POST /api/auth/fund-wallet
   → Activate wallet with 5 HBAR

3. GET /api/auth/me
   → Verify wallet is activated
```

### 2. Existing User Login Flow

```
1. POST /api/auth/login
   → Receive JWT token + wallet info

2. GET /api/auth/me
   → Get latest profile + balance
```

---

## Testing with cURL

### Register a new user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Smith",
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
    fullName: "Jane Smith",
    email: "jane@example.com",
    password: "securepassword",
  }),
});

const data = await response.json();
const token = data.data.token;
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

## Additional Notes

- All timestamps are in ISO 8601 format
- Balances are in HBAR (not tinybars)
- Account IDs follow Hedera format: `0.0.xxxxx`
- EVM addresses are 42 characters (0x + 40 hex chars)
- JWT tokens expire after 7 days (configurable)

---

**Last Updated**: October 27, 2025
