# 🚀 Quick Start - Ingress Backend

**Welcome!** Follow these 5 simple steps to get your Ingress backend up and running.

---

## ⚡ 5-Minute Setup

### Step 1️⃣: Install Dependencies (1 min)

```bash
cd backend
npm install
```

### Step 2️⃣: Generate Security Keys (1 min)

```bash
node scripts/generate-keys.js
```

📋 **Copy the output** - you'll need it in the next step!

### Step 3️⃣: Get Hedera Credentials (2 min)

1. Go to → [https://portal.hedera.com/](https://portal.hedera.com/)
2. Sign up/Login (free)
3. Create a **Testnet** account
4. Copy your **Operator ID** and **Private Key**

### Step 4️⃣: Configure Environment (1 min)

The `.env` file already exists with your MongoDB connection. You just need to add:

1. Open `backend/.env` in your editor
2. Paste the keys from Step 2 into these fields:
   - `MASTER_SEED=`
   - `ENCRYPTION_SECRET_KEY=`
   - `JWT_SECRET=`
3. Add your Hedera credentials from Step 3:
   - `HEDERA_OPERATOR_ID=`
   - `HEDERA_OPERATOR_KEY=`

**Your `.env` should look like this:**

```env
PORT=3000
NODE_ENV=development

MONGO_URI=mongodb+srv://iteoluwakisibello_db_user:WgvcjU9TyjCVM1dz@cluster1.gzkfjro.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1

JWT_SECRET=<paste from step 2>
JWT_EXPIRES_IN=7d

HEDERA_OPERATOR_ID=<paste from step 3>
HEDERA_OPERATOR_KEY=<paste from step 3>

MASTER_SEED=<paste from step 2>
ENCRYPTION_SECRET_KEY=<paste from step 2>

ACTIVATION_AMOUNT=5
```

### Step 5️⃣: Start the Server! 🎉

```bash
npm run dev
```

You should see:

```
✅ MongoDB Connected: cluster1.gzkfjro.mongodb.net
✅ Hedera blockchain service initialized
✅ Server is running on port 3000
```

---

## 🧪 Test It!

### Quick Test (cURL)

```bash
# Test server health
curl http://localhost:3000/

# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**You should see a success response with a JWT token and wallet info!** 🎉

---

## 📚 What's Next?

Now that your server is running:

1. ✅ **Test all endpoints** → See `API_DOCUMENTATION.md`
2. ✅ **Complete setup guide** → See `SETUP_GUIDE.md`
3. ✅ **Build your frontend** → Connect to these APIs
4. ✅ **Explore the code** → Check out the `src/` folder

---

## 🆘 Having Issues?

### Common Problems

**❌ Error: "MASTER_SEED must be set"**
→ Run `node scripts/generate-keys.js` and add keys to `.env`

**❌ Error: "Failed to create Hedera account"**
→ Check your Hedera credentials in `.env`
→ Make sure your operator account has HBAR (use testnet faucet)

**❌ Error: "MongoDB connection failed"**
→ The URI is already configured, check your internet connection
→ Visit MongoDB Atlas and ensure your IP is whitelisted

**❌ Port 3000 in use**
→ Change `PORT=3001` in `.env`

---

## 📖 Documentation

- **API Reference**: `API_DOCUMENTATION.md`
- **Complete Setup**: `SETUP_GUIDE.md`
- **Project Info**: `README.md`

---

## 🎯 API Endpoints Overview

| Endpoint                | Method | Auth | Description       |
| ----------------------- | ------ | ---- | ----------------- |
| `/`                     | GET    | No   | Health check      |
| `/api/auth/register`    | POST   | No   | Register new user |
| `/api/auth/login`       | POST   | No   | Login user        |
| `/api/auth/me`          | GET    | Yes  | Get profile       |
| `/api/auth/fund-wallet` | POST   | Yes  | Activate wallet   |

---

## 💡 Pro Tips

1. Use **Postman** or **Thunder Client** for easier API testing
2. Keep your `.env` file secure - never commit it!
3. Your operator account needs HBAR - get free testnet HBAR from the Hedera faucet
4. Each user gets a unique Hedera wallet on registration
5. Wallets need to be funded with 5 HBAR to activate

---

**Happy Coding! 🚀**

Need help? Check the troubleshooting section in `SETUP_GUIDE.md`
