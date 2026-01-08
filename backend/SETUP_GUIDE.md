# Ingress Backend Setup Guide

Complete step-by-step guide to set up the Ingress backend with Hedera integration.

## 📋 Prerequisites

- Node.js v18+ installed
- npm or yarn package manager
- Hedera Testnet account (free)
- MongoDB Atlas account (free tier available)

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Generate Security Keys

Run the key generation script:

```bash
node scripts/generate-keys.js
```

This will generate:

- ✅ MASTER_SEED (24-word mnemonic for deterministic wallet generation)
- ✅ ENCRYPTION_SECRET_KEY (AES-256 encryption key)
- ✅ JWT_SECRET (JWT token signing key)

**⚠️ IMPORTANT**: Save these keys securely! Never commit them to version control.

### Step 3: Get Hedera Testnet Credentials

1. Visit [Hedera Portal](https://portal.hedera.com/)
2. Click "Sign Up" or "Login"
3. Create a new **Testnet** account (it's free!)
4. Copy your:
   - **Operator ID** (format: `0.0.12345`)
   - **Operator Private Key** (format: `302e020100300506032b657004220420...`)

### Step 4: Create .env File

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Or create it manually with this content:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database (Your MongoDB connection string)
MONGO_URI=mongodb+srv://iteoluwakisibello_db_user:WgvcjU9TyjCVM1dz@cluster1.gzkfjro.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1

# JWT Configuration (use generated value from step 2)
JWT_SECRET=your-generated-jwt-secret-here
JWT_EXPIRES_IN=7d

# Hedera Configuration (from step 3)
HEDERA_OPERATOR_ID=0.0.YOUR_OPERATOR_ID
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420YOUR_PRIVATE_KEY

# Wallet Generation (use generated values from step 2)
MASTER_SEED=your 24 word mnemonic seed phrase here
ENCRYPTION_SECRET_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Wallet Activation Amount (in HBAR)
ACTIVATION_AMOUNT=5
```

### Step 5: Verify MongoDB Connection

Make sure your MongoDB URI is correct and your IP is whitelisted:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to your cluster
3. Click "Network Access" in the left sidebar
4. Click "Add IP Address"
5. Click "Allow Access from Anywhere" (or add your specific IP)

### Step 6: Start the Server

Development mode with auto-reload:

```bash
npm run dev
```

You should see:

```
✅ MongoDB Connected: cluster1.gzkfjro.mongodb.net
✅ Hedera blockchain service initialized with operator: 0.0.YOUR_ID
✅ Server is running on port 3000
   Environment: development
```

## 🧪 Testing the API

### Test 1: Health Check

```bash
curl http://localhost:3000/
```

Expected response:

```json
{
  "success": true,
  "message": "Ingress API Server",
  "version": "1.0.0"
}
```

### Test 2: User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "wallet": {
      "accountId": "0.0.12345",
      "evmAddress": "0x...",
      "isActivated": false,
      "balance": 0,
      "activationRequired": "5"
    }
  }
}
```

### Test 3: User Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Test 4: Get User Profile (Protected Route)

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Test 5: Fund Wallet (Activate)

```bash
curl -X POST http://localhost:3000/api/auth/fund-wallet \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## 📱 Using Postman or Thunder Client

### Collection Setup

1. **Base URL**: `http://localhost:3000`

2. **Register Endpoint**:

   - Method: POST
   - URL: `{{baseUrl}}/api/auth/register`
   - Body (JSON):
     ```json
     {
       "fullName": "John Doe",
       "email": "john@example.com",
       "password": "password123"
     }
     ```

3. **Login Endpoint**:

   - Method: POST
   - URL: `{{baseUrl}}/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "john@example.com",
       "password": "password123"
     }
     ```
   - After login, copy the `token` from response

4. **Get Profile** (Protected):

   - Method: GET
   - URL: `{{baseUrl}}/api/auth/me`
   - Headers: `Authorization: Bearer YOUR_TOKEN_HERE`

5. **Fund Wallet** (Protected):
   - Method: POST
   - URL: `{{baseUrl}}/api/auth/fund-wallet`
   - Headers: `Authorization: Bearer YOUR_TOKEN_HERE`

## 🔍 How It Works

### Registration Flow

1. **User submits**: Full name, email, password
2. **System creates**:
   - User record in MongoDB (password hashed with bcrypt)
   - Deterministic HD wallet from email using BIP39/BIP44
   - Hedera account on blockchain
   - Encrypted private key stored in database (AES-256-GCM)
3. **Returns**: JWT token + wallet info

### Login Flow

1. **User submits**: Email, password
2. **System validates**:
   - Email exists
   - Password matches (bcrypt comparison)
3. **System retrieves**:
   - User data
   - Wallet data
   - Current balance from blockchain
4. **Returns**: JWT token + wallet info

### Wallet Activation Flow

1. **User calls**: `/api/auth/fund-wallet` endpoint
2. **System transfers**: 5 HBAR from operator to user's wallet
3. **System updates**: Wallet marked as activated
4. **User can now**: Use wallet for transactions

## 🔐 Security Features

1. **Password Security**:

   - Passwords hashed with bcrypt (10 salt rounds)
   - Never stored in plain text

2. **Private Key Security**:

   - Encrypted with AES-256-GCM
   - Encryption key stored in environment variable
   - Additional Authentication Data (AAD) used
   - Auth tag for integrity verification

3. **Deterministic Wallets**:

   - BIP39 24-word master seed
   - BIP44 derivation path
   - Email-based deterministic index
   - Same email always generates same wallet

4. **JWT Authentication**:
   - Secure token-based authentication
   - Configurable expiration time
   - Protected routes require valid token

## 🛠️ Troubleshooting

### Error: "MASTER_SEED must be set"

**Solution**: Run `node scripts/generate-keys.js` and add the keys to `.env`

### Error: "Failed to create Hedera account"

**Possible causes**:

- Invalid Hedera operator credentials
- Insufficient HBAR balance in operator account
- Network connectivity issues

**Solutions**:

1. Verify your operator ID and key in `.env`
2. Check operator balance at [HashScan](https://hashscan.io/testnet)
3. Get free testnet HBAR from [Hedera Faucet](https://portal.hedera.com/faucet)

### Error: "MongoDB connection failed"

**Solutions**:

1. Verify MongoDB URI is correct
2. Check if your IP is whitelisted in MongoDB Atlas
3. Ensure database user has correct permissions

### Error: "Token expired"

**Solution**: Login again to get a new token

### Port 3000 already in use

**Solution**:

```bash
# Change PORT in .env file
PORT=3001
```

Or kill the process using port 3000:

```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## 📊 Database Schema

### User Collection

```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String (unique, indexed),
  password: String (hashed),
  walletId: ObjectId (ref: Wallet),
  createdAt: Date,
  updatedAt: Date
}
```

### Wallet Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  email: String (unique, indexed),
  accountId: String (unique, indexed), // Hedera account ID
  evmAddress: String, // EVM-compatible address
  encryptedPrivateKey: String,
  iv: String,
  authTag: String,
  isActivated: Boolean,
  balance: Number,
  trackedWallets: [String],
  copyTrade: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🎯 Next Steps

After successful setup, you can:

1. ✅ Build a frontend to consume this API
2. ✅ Add more blockchain features (token swaps, transfers)
3. ✅ Implement copy trading functionality
4. ✅ Add transaction history
5. ✅ Implement wallet tracking

## 📚 Additional Resources

- [Hedera Documentation](https://docs.hedera.com/)
- [Hedera SDK for JavaScript](https://github.com/hashgraph/hedera-sdk-js)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)
- [JWT Documentation](https://jwt.io/)

## 💡 Tips

- Always use testnet for development
- Never commit `.env` file to git
- Keep your operator private key secure
- Regular backup of master seed and encryption key
- Monitor operator account balance
- Use strong passwords for production

## 🐛 Need Help?

If you encounter issues not covered in this guide, check:

1. Server logs for detailed error messages
2. MongoDB logs in Atlas dashboard
3. Hedera transaction status on HashScan
4. Network connectivity

---

**Happy Building! 🚀**

