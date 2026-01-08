# Bank Account Funding Guide

## Overview

Your profile tab now includes a Paystack Bank Account section that allows you to:

- Create a virtual bank account
- View account details and balance
- Fund your account via bank transfer
- View transaction history

## How It Works

### Backend Setup ✅

All backend endpoints are already implemented:

| Endpoint                        | Purpose                        |
| ------------------------------- | ------------------------------ |
| `POST /api/bank-account/create` | Create virtual account         |
| `GET /api/bank-account/details` | Get account info               |
| `GET /api/bank-account/balance` | Get current balance            |
| `GET /api/webhook/transactions` | Get transaction history        |
| `POST /api/webhook/paystack`    | Auto-updates balance (webhook) |

### Frontend Integration ✅

New components added:

1. **`useBankAccount` Hook** (`hooks/useBankAccount.ts`)

   - Handles all bank account API calls
   - Manages loading and error states

2. **Profile Tab Update** (`components/profile-tab.tsx`)
   - New "PAYSTACK BANK ACCOUNT" section
   - Create account form
   - Account details display
   - Transaction history

## Testing Steps

### 1. Start Your Backend Server

```bash
cd backend
npm run dev
```

The server should be running on `http://localhost:3000`

### 2. Start Your Frontend

```bash
cd frontend
npm run dev
```

The frontend should be running on `http://localhost:3001` (or the next available port)

### 3. Create a Bank Account

1. **Register/Login** to your account
2. Go to **Dashboard** → **Profile Tab**
3. Scroll to the **"PAYSTACK BANK ACCOUNT"** section
4. Click **[CREATE ACCOUNT]**
5. Fill in the form:
   - **BVN**: Enter any 11 digits for testing (e.g., `12345678901`)
   - **Phone**: Enter a Nigerian phone number (e.g., `08012345678`)
6. Click **[CREATE ACCOUNT]**

### 4. View Account Details

Once created, you'll see:

- Account balance (₦0 initially)
- Account number (click [SHOW] to reveal)
- Account name
- Bank name (Test Bank)
- Funding instructions

### 5. Fund Your Account (Testing)

#### Option A: Using Paystack Test Cards (Recommended for Development)

Paystack test mode doesn't support real bank transfers, but you can simulate funding using:

1. **Use the Paystack Dashboard**:

   - Log in to [Paystack Dashboard](https://dashboard.paystack.com/)
   - Go to **Customers** → Find your customer
   - Use the "Test Payment" feature

2. **Webhook Testing**:
   The webhook at `POST /api/webhook/paystack` will automatically:
   - Receive payment notifications
   - Update your account balance
   - Save transaction history

#### Option B: Webhook Simulation (For Local Testing)

You can manually trigger a webhook using this curl command:

```bash
curl -X POST http://localhost:3000/api/webhook/paystack \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: test" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "test-ref-'$(date +%s)'",
      "amount": 500000,
      "currency": "NGN",
      "customer": {
        "email": "your-email@example.com"
      },
      "channel": "dedicated_nuban",
      "paid_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
      "metadata": {
        "account_number": "YOUR_ACCOUNT_NUMBER"
      }
    }
  }'
```

**Note**: Replace:

- `your-email@example.com` with your registered email
- `YOUR_ACCOUNT_NUMBER` with your generated account number
- Amount is in kobo (500000 = ₦5,000)

### 6. Check Updated Balance

After funding:

1. Refresh your profile page
2. Your balance should be updated
3. Transaction should appear in "RECENT TRANSACTIONS"

## Production Setup

### For Live Payments

1. **Get Live API Keys**:

   - Go to [Paystack Dashboard](https://dashboard.paystack.com/)
   - Copy your **Live Secret Key** and **Live Public Key**

2. **Request Dedicated Virtual Accounts**:

   - Email Paystack at support@paystack.com
   - Request access to Dedicated Virtual Accounts
   - They'll enable it for your business

3. **Update Backend Environment**:

   ```env
   PAYSTACK_SECRET_KEY=sk_live_YOUR_LIVE_KEY
   PAYSTACK_PUBLIC_KEY=pk_live_YOUR_LIVE_KEY
   ```

4. **Update Bank Selection**:
   In `profile-tab.tsx`, change `preferredBank`:

   ```typescript
   preferredBank: "wema-bank"; // or "titan-paystack"
   ```

5. **Setup Webhook URL**:
   - In Paystack Dashboard → Settings → Webhooks
   - Add your production webhook URL: `https://yourdomain.com/api/webhook/paystack`

## Features Implemented

### Create Bank Account

- ✅ BVN validation (11 digits)
- ✅ Phone number validation (Nigerian format)
- ✅ Auto-populate name from user profile
- ✅ Test bank support for development

### View Account Details

- ✅ Account number (show/hide with copy)
- ✅ Account name
- ✅ Bank name
- ✅ Current balance
- ✅ Currency display

### Funding Instructions

- ✅ Clear step-by-step guide
- ✅ Test mode indicator
- ✅ Automatic balance updates

### Transaction History

- ✅ Recent 5 transactions
- ✅ Status indicators (success/failed/pending)
- ✅ Amount and date display

## UI Features

- **Consistent Design**: Matches your existing design system
- **Show/Hide**: Sensitive information (account number)
- **Copy to Clipboard**: Easy account number copying
- **Loading States**: Visual feedback during operations
- **Error Handling**: User-friendly error messages
- **Responsive**: Works on all screen sizes

## API Endpoints Reference

### Create Bank Account

```typescript
POST /api/bank-account/create
Authorization: Bearer <token>

{
  "bvn": "12345678901",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "08012345678",
  "preferredBank": "test-bank"
}
```

### Get Account Details

```typescript
GET / api / bank - account / details;
Authorization: Bearer<token>;
```

### Get Balance

```typescript
GET / api / bank - account / balance;
Authorization: Bearer<token>;
```

### Get Transactions

```typescript
GET /api/webhook/transactions?page=1&limit=10
Authorization: Bearer <token>
```

## Troubleshooting

### "Failed to create bank account"

- ✅ Check backend server is running
- ✅ Verify Paystack API keys in backend `.env`
- ✅ Check browser console for errors
- ✅ Ensure BVN is exactly 11 digits
- ✅ Verify phone number format

### "No bank account found"

- ✅ You haven't created an account yet
- ✅ Click [CREATE ACCOUNT] to start

### Balance Not Updating

- ✅ Check webhook is configured correctly
- ✅ Verify payment was successful in Paystack Dashboard
- ✅ Check backend logs for webhook events
- ✅ Refresh the page

### Transaction Not Showing

- ✅ Webhook might not have fired yet
- ✅ Check backend logs for incoming webhooks
- ✅ Verify transaction exists in database

## Next Steps

1. **Test the complete flow** on your local machine
2. **Add payment cards** in Paystack test mode (if needed)
3. **Monitor webhook events** in backend console
4. **Check transaction history** after successful funding
5. **Prepare for production** by following production setup guide

## Support

- **Paystack Docs**: https://paystack.com/docs
- **Test Cards**: https://paystack.com/docs/payments/test-payments
- **Virtual Accounts**: https://paystack.com/docs/payments/dedicated-virtual-accounts

---

**Happy Testing! 🎉**
