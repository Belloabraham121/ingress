# Paystack Production Setup Guide

## Important: Test vs Production Banks

### For Testing (Current Setup)

✅ **Currently Active:** Using `test-bank` for development

```json
{
  "preferredBank": "test-bank"
}
```

This works with test API keys and is perfect for development.

---

## Enabling Production Banks

To use **Wema Bank** or **Titan (Paystack)** for real money transfers, you need:

### Step 1: Request Dedicated NUBAN Feature

1. **Email Paystack Support:**

   - Send to: `support@paystack.com`
   - Subject: "Request for Dedicated Virtual Accounts (NUBAN)"
   - Include:
     - Your business name
     - Business registration documents
     - Intended use case
     - Expected transaction volume

2. **Wait for Approval:**
   - Paystack will review your request
   - They may ask for additional documentation
   - Approval typically takes 3-5 business days

### Step 2: Business Verification

You'll need to provide:

- ✅ Certificate of Incorporation
- ✅ CAC Form (for Nigerian businesses)
- ✅ Valid ID of directors
- ✅ Proof of business address
- ✅ Bank account statement

### Step 3: Switch to Live Keys

Once approved:

1. **Update Environment Variables:**

```env
# .env file
PAYSTACK_SECRET_KEY=sk_live_your_actual_live_key
PAYSTACK_PUBLIC_KEY=pk_live_your_actual_live_key
```

2. **Update Code (if needed):**

The code already supports this. Just change `preferredBank`:

```json
{
  "bvn": "actual_bvn",
  "firstName": "Real",
  "lastName": "Name",
  "phone": "08012345678",
  "preferredBank": "wema-bank" // or "titan-paystack"
}
```

---

## Current Error Explanation

```
'Dedicated NUBAN is not available for your business'
```

This error means:

- ❌ Your Paystack account doesn't have Dedicated Virtual Accounts enabled
- ❌ You're using production bank codes (`wema-bank`, `titan-paystack`) without approval
- ✅ **Solution:** Use `"test-bank"` for testing (already implemented)

---

## Testing vs Production Comparison

| Feature                | Test Mode (`test-bank`) | Production Mode (`wema-bank`/`titan`) |
| ---------------------- | ----------------------- | ------------------------------------- |
| **Setup Required**     | None                    | Paystack approval needed              |
| **API Keys**           | Test keys               | Live keys                             |
| **Real Money**         | No                      | Yes                                   |
| **BVN Required**       | Test BVN (12345678901)  | Real BVN                              |
| **Transaction Limits** | Unlimited (test)        | Based on your Paystack tier           |
| **Webhooks**           | Work normally           | Work normally                         |
| **Account Numbers**    | Test account numbers    | Real bank account numbers             |

---

## How to Test Right Now

✅ **The code is already updated!** Just use:

```bash
# Registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Get token from response, then:

# Create Bank Account
curl -X POST http://localhost:3000/api/bank-account/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "bvn": "12345678901",
    "firstName": "Test",
    "lastName": "User",
    "phone": "08012345678",
    "preferredBank": "test-bank"
  }'
```

You'll receive a test account number that you can use with Paystack's test payment tools.

---

## Simulating Payments in Test Mode

### Option 1: Paystack Dashboard

1. Go to [Paystack Test Dashboard](https://dashboard.paystack.com/#/test)
2. Navigate to **Testing Tools**
3. Use the **Simulate Payment** feature
4. Enter your test account number
5. Enter amount (in kobo: 5000 = ₦50)
6. Click "Simulate"

### Option 2: API Testing

Paystack provides test API endpoints you can use to simulate incoming payments.

---

## Production Checklist

Before going live with real customers:

- [ ] Request and receive Dedicated NUBAN approval from Paystack
- [ ] Complete business verification
- [ ] Switch to live API keys
- [ ] Update `preferredBank` to `"wema-bank"` or `"titan-paystack"`
- [ ] Test with small real transactions
- [ ] Set up proper error handling
- [ ] Configure production webhooks
- [ ] Set up transaction monitoring
- [ ] Implement fraud detection
- [ ] Add transaction limits
- [ ] Set up customer support process

---

## FAQs

### Q: Can I test payments without production approval?

**A:** Yes! Use `"test-bank"` (already implemented). This works perfectly for development and testing.

### Q: How long does Paystack approval take?

**A:** Typically 3-5 business days for Nigerian businesses with complete documentation.

### Q: Is test-bank the same as production banks?

**A:** Functionally identical for testing, but:

- Test accounts don't receive real money
- Test mode has no transaction limits
- Test BVNs work (like `12345678901`)

### Q: Do I need to change my code for production?

**A:** Minimal changes needed:

1. Update API keys to live keys
2. Users provide real BVNs
3. Optionally change default bank from `test-bank` to `wema-bank`

The backend code already supports both test and production modes!

---

## Support Contacts

- **Paystack Support:** support@paystack.com
- **Paystack Developers:** developers@paystack.com
- **Paystack Documentation:** https://paystack.com/docs/payments/dedicated-virtual-accounts
- **Paystack Community:** https://community.paystack.com

---

**Current Status:** ✅ Test mode active and working
**Next Step:** Continue testing with `test-bank`, request production approval when ready to go live

---

**Last Updated:** January 28, 2025
