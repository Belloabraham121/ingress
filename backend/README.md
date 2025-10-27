# Ingress Backend API

Backend API for Ingress platform with Hedera blockchain integration, user authentication, and wallet management.

## Features

- ✅ User Registration & Login with JWT authentication
- ✅ Automatic Hedera wallet generation for each user
- ✅ Deterministic wallet creation based on email
- ✅ Encrypted private key storage (AES-256-GCM)
- ✅ Wallet activation with funding
- ✅ MongoDB integration for user and wallet data

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB instance
- Hedera Testnet account (Operator ID and Private Key)

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Generate Required Keys

You need to generate secure keys for wallet generation and encryption.

#### Generate Master Seed (24-word mnemonic)

```bash
node -e "const bip39 = require('bip39'); console.log(bip39.generateMnemonic(256));"
```

#### Generate Encryption Secret Key

```bash
node -e "const crypto = require('crypto'); console.log('0x' + crypto.randomBytes(32).toString('hex'));"
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://iteoluwakisibello_db_user:WgvcjU9TyjCVM1dz@cluster1.gzkfjro.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1

# JWT
JWT_SECRET=your-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Hedera (Get these from portal.hedera.com)
HEDERA_OPERATOR_ID=0.0.YOUR_OPERATOR_ID
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420YOUR_PRIVATE_KEY

# Wallet Generation
MASTER_SEED=your 24 word mnemonic seed phrase here
ENCRYPTION_SECRET_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Wallet Activation
ACTIVATION_AMOUNT=5
```

### 4. Get Hedera Testnet Credentials

1. Go to [Hedera Portal](https://portal.hedera.com/)
2. Create a testnet account
3. Get your Operator ID and Private Key
4. Add them to your `.env` file

### 5. Run the Server

Development mode with auto-reload:

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

## API Endpoints

### Authentication

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

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

#### Login User

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
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
      "isActivated": true,
      "balance": 5,
      "activationRequired": 0
    }
  }
}
```

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Fund Wallet (Activate)

```http
POST /api/auth/fund-wallet
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Wallet funded successfully with 5 HBAR",
  "data": {
    "txId": "0.0.123@1234567890.123456789",
    "wallet": {
      "accountId": "0.0.12345",
      "isActivated": true,
      "balance": 5
    }
  }
}
```

## Architecture

### Models

- **User**: Stores user authentication data (name, email, password)
- **Wallet**: Stores wallet information (account ID, encrypted private key, balance)

### Services

- **WalletGeneratorService**: Generates deterministic HD wallets and handles encryption
- **BlockchainService**: Interacts with Hedera blockchain (account creation, transfers)

### Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Authentication**: Secure token-based auth
3. **Private Key Encryption**: AES-256-GCM encryption
4. **Deterministic Wallets**: BIP39/BIP44 HD wallet generation
5. **Environment Variables**: Sensitive data stored securely

## Workflow

1. **User Registration**:

   - User provides name, email, password
   - System hashes password and creates user record
   - Generates deterministic wallet from email
   - Creates Hedera account on blockchain
   - Encrypts and stores private key
   - Returns JWT token and wallet info

2. **User Login**:

   - User provides email and password
   - System validates credentials
   - Retrieves wallet information
   - Updates balance from blockchain
   - Returns JWT token and wallet info

3. **Wallet Activation**:
   - User calls fund-wallet endpoint
   - System transfers ACTIVATION_AMOUNT HBAR to user's wallet
   - Marks wallet as activated
   - User can now use wallet for transactions

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## Testing

You can test the API using tools like:

- Postman
- cURL
- Thunder Client (VS Code extension)
- Insomnia

## Troubleshooting

### "HEDERA_OPERATOR_ID must be set"

- Make sure you've created a `.env` file with your Hedera credentials

### "Invalid master seed mnemonic"

- Ensure your MASTER_SEED is a valid 24-word BIP39 mnemonic

### "Failed to create Hedera account"

- Check your Hedera operator credentials
- Ensure your operator account has sufficient HBAR balance

### MongoDB connection errors

- Verify your MONGO_URI is correct
- Check if your IP is whitelisted in MongoDB Atlas

## License

MIT
