# 🔄 RESTART INSTRUCTIONS - Fix Paystack Error

## ⚠️ CRITICAL: You MUST restart your backend server!

The code has been updated to use `test-bank`, but **your server is still running the old code**.

---

## 🚀 Steps to Fix

### Step 1: Stop Your Current Server

In your terminal where the backend is running:

1. Press **Ctrl + C** (or Command + C on Mac)
2. Wait for the server to fully stop
3. You should see the terminal prompt return

### Step 2: Restart the Backend Server

```bash
cd /Users/iteoluwakisibello/Documents/ingress/backend
npm run dev
```

You should see:

```
✅ Server is running on port 3000
   Environment: development
```

### Step 3: Verify the Changes

Now the logs will show:

```
🔍 Paystack Request: {
  customer: 'CUS_xxx',
  preferred_bank: 'test-bank',  ← Should say 'test-bank' now!
  hasBvn: true
}
```

Instead of seeing `preferred_bank: 'wema-bank'` or `titan-paystack`.

---

## 🧪 Test It

### Quick Test with cURL

```bash
# 1. Register a new user (use a NEW email)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "newtest@example.com",
    "password": "password123"
  }'
```

**Copy the token from the response**, then:

```bash
# 2. Create bank account
curl -X POST http://localhost:3000/api/bank-account/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PASTE_TOKEN_HERE" \
  -d '{
    "bvn": "12345678901",
    "firstName": "Test",
    "lastName": "User",
    "phone": "08012345678",
    "preferredBank": "test-bank"
  }'
```

### Expected Success Response

```json
{
  "success": true,
  "message": "Bank account created successfully",
  "data": {
    "accountNumber": "1234567890",
    "accountName": "Test User",
    "bankName": "Test Bank",
    "currency": "NGN",
    "isActive": true,
    "instructions": "Transfer money to this account to fund your wallet"
  }
}
```

✅ **If you see this, it worked!**

---

## 🔍 What to Look For in Logs

### ✅ Good Logs (Success)

```
Creating Paystack customer...
Creating dedicated virtual account...
🔍 Paystack Request: {
  customer: 'CUS_xxx',
  preferred_bank: 'test-bank',  ← This is correct!
  hasBvn: true
}
✅ Dedicated account created successfully
```

### ❌ Bad Logs (Still Failing)

```
Creating Paystack customer...
Creating dedicated virtual account...
❌ Create dedicated account error: {
  status: false,
  message: 'Dedicated NUBAN is not available for your business',
  ...
}
```

If you see the bad logs, it means the server wasn't restarted properly.

---

## 🚨 Troubleshooting

### Problem: Still seeing "Dedicated NUBAN is not available"

**Solution:**

1. Make sure you **completely stopped** the old server (Ctrl+C)
2. Check if any other Node process is running:
   ```bash
   lsof -ti:3000
   ```
   If it shows a process ID, kill it:
   ```bash
   kill -9 $(lsof -ti:3000)
   ```
3. Restart the server fresh

### Problem: "Port 3000 is already in use"

**Solution:**

```bash
# Kill the process on port 3000
lsof -ti:3000 | xargs kill -9

# Then restart
npm run dev
```

### Problem: Changes not reflecting

**Solution:**

1. Clear any caching:
   ```bash
   rm -rf node_modules/.cache
   ```
2. Restart server

---

## 📝 What Changed in the Code

### Backend Controller

**File:** `src/controllers/bankAccount.controller.ts`

```typescript
// Line 108 - Now defaults to test-bank
const defaultBank = preferredBank || "test-bank";
```

### Paystack Service

**File:** `src/services/paystack.service.ts`

```typescript
// Line 196 - Default parameter changed
async createDedicatedAccount(
  customerCode: string,
  preferredBank: string = "test-bank",  // ← Changed from "wema-bank"
  bvn?: string
)
```

---

## ✅ Checklist

- [ ] Stop the backend server (Ctrl+C)
- [ ] Confirm server has stopped (terminal shows prompt)
- [ ] Run `npm run dev` to restart
- [ ] See "Server is running on port 3000"
- [ ] Test with cURL or frontend
- [ ] Check logs show `preferred_bank: 'test-bank'`
- [ ] Receive success response with account number

---

## 🎯 Next Steps After Success

Once you get a successful account creation:

1. ✅ **Save the account number** you receive
2. ✅ Test payments using [Paystack Dashboard](https://dashboard.paystack.com/#/test)
3. ✅ Test the webhook by simulating a payment
4. ✅ Check balance updates automatically
5. ✅ View transaction history

---

## 💡 Pro Tip

Add this script to your `package.json` for easy restart:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "restart": "npm run dev"  ← Add this
  }
}
```

Then you can just run: `npm restart`

---

**Remember:** The code is correct now, you just need to **RESTART THE SERVER**! 🔄

---

**Status:** ⏳ Waiting for server restart
**What to do:** Stop server → Run `npm run dev` → Test again

Good luck! 🚀
