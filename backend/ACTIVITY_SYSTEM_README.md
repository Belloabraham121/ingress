# Recent Activity System

This document describes the Recent Activity tracking system implemented in the Ingress backend.

## Overview

The Recent Activity system tracks and stores successful transactions across three main features:

- **Swap/Exchange**: Token swaps and exchanges
- **Invest**: Vault deposits and investments
- **Stake**: Staking pool deposits

## Database Schema

### Activity Model (`/backend/src/models/Activity.ts`)

```typescript
{
  userId: ObjectId,              // Reference to User
  activityType: "swap" | "invest" | "stake",
  amount: string,                // Transaction amount
  tokenSymbol: string,           // Token symbol (e.g., "USDT", "USDC")

  // For swap transactions
  fromToken: string,             // Source token
  toToken: string,               // Destination token

  // For invest transactions
  vaultName: string,             // Vault name
  vaultAddress: string,          // Vault contract address

  // For stake transactions
  poolName: string,              // Pool name
  poolId: number,                // Pool ID
  stakingPoolAddress: string,    // Staking pool contract address

  transactionHash: string,       // Hedera transaction hash
  status: "success" | "failed" | "pending",
  metadata: object,              // Additional transaction data
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### 1. Get User Activities (Paginated)

```
GET /api/activity/list
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `type` (optional): Filter by activity type ("swap" | "invest" | "stake")

**Response:**

```json
{
  "success": true,
  "message": "Activities retrieved successfully",
  "data": [
    {
      "_id": "...",
      "userId": "...",
      "activityType": "invest",
      "amount": "1000000000000000000000",
      "tokenSymbol": "USDT",
      "vaultName": "High Yield USDT Vault",
      "vaultAddress": "0x...",
      "transactionHash": "0.0.1234@1234567890.123456789",
      "status": "success",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 2. Get Recent Activities

```
GET /api/activity/recent
```

**Query Parameters:**

- `limit` (optional): Number of activities (default: 10, max: 50)

**Response:**

```json
{
  "success": true,
  "message": "Recent activities retrieved successfully",
  "data": [...]
}
```

### 3. Get Activity by Transaction Hash

```
GET /api/activity/transaction/:hash
```

**Response:**

```json
{
  "success": true,
  "message": "Activity retrieved successfully",
  "data": {...}
}
```

### 4. Get Activity Statistics

```
GET /api/activity/stats
```

**Response:**

```json
{
  "success": true,
  "message": "Activity statistics retrieved successfully",
  "data": {
    "totalActivities": 150,
    "totalSwaps": 45,
    "totalInvestments": 60,
    "totalStakes": 45
  }
}
```

## Integration Points

### Vault Deposits

When a user successfully deposits to a vault, the system automatically records the activity.

**Updated Endpoint:**

```
POST /api/vault/sign-deposit
```

**Request Body (updated):**

```json
{
  "vaultAddress": "0x...",
  "amount": "1000000000000000000000",
  "vaultName": "High Yield USDT Vault", // NEW
  "tokenSymbol": "USDT" // NEW
}
```

### Staking

When a user successfully stakes tokens, the system automatically records the activity.

**Updated Endpoint:**

```
POST /api/staking/sign-stake
```

**Request Body (updated):**

```json
{
  "stakingPoolAddress": "0x...",
  "poolId": 0,
  "amount": "1000000000000000000000",
  "poolName": "USDT Pool", // NEW
  "tokenSymbol": "USDT" // NEW
}
```

### Token Swaps

When a user successfully swaps tokens, the system automatically records the activity.

**New Endpoint:**

```
POST /api/exchange/sign-swap
```

**Request Body:**

```json
{
  "exchangeAddress": "0x...",
  "fromTokenAddress": "0x...",
  "toTokenAddress": "0x...",
  "amount": "1000000000000000000000",
  "fromTokenSymbol": "USDT",
  "toTokenSymbol": "USDC",
  "expectedAmount": "1000000000000000000000"
}
```

## Frontend Integration

### Custom Hook

Use the `useActivity` hook to fetch and manage activities:

```typescript
import { useActivity } from "@/hooks/useActivity";

const {
  activities,
  loading,
  error,
  pagination,
  getActivities,
  getRecentActivities,
  getActivityByTransaction,
  getActivityStats,
} = useActivity();

// Get paginated activities
await getActivities(1, 20, "invest");

// Get recent activities
await getRecentActivities(10);

// Get activity by transaction hash
await getActivityByTransaction("0.0.1234@1234567890.123456789");

// Get statistics
await getActivityStats();
```

### Component

Use the `RecentActivityCard` component to display activities:

```tsx
import { RecentActivityCard } from "@/components/recent-activity-card";

// Show all recent activities
<RecentActivityCard limit={5} />

// Show only swap activities
<RecentActivityCard activityType="swap" limit={5} />

// Show only invest activities
<RecentActivityCard activityType="invest" limit={5} />

// Show only stake activities
<RecentActivityCard activityType="stake" limit={5} />
```

## Activity Logging Process

1. User initiates a transaction (vault deposit, stake, or swap)
2. Backend processes the transaction through Hedera SDK
3. If transaction is successful (receipt status === "SUCCESS"):
   - Activity service creates a new activity record
   - Record includes all relevant transaction details
   - Transaction hash is stored for reference
4. If activity logging fails:
   - Error is logged but transaction still succeeds
   - User is not impacted by activity logging failure

## Features

✅ **Automatic Tracking**: Activities are automatically recorded on successful transactions  
✅ **Pagination Support**: Efficiently handles large activity lists  
✅ **Type Filtering**: Filter by swap, invest, or stake activities  
✅ **Real-time Updates**: New activities appear immediately after transactions  
✅ **Transaction Links**: Direct links to HashScan for verification  
✅ **Status Tracking**: Shows success, failed, or pending status  
✅ **User Isolation**: Each user only sees their own activities  
✅ **No Storage Limit**: All activities are stored indefinitely

## Error Handling

Activity logging is designed to be non-critical:

- If activity logging fails, the transaction still succeeds
- Errors are logged for debugging
- User experience is not impacted

## Database Indexes

The Activity model has the following indexes for optimal performance:

- `{ userId: 1, createdAt: -1 }` - For efficient user activity queries
- `{ userId: 1, activityType: 1, createdAt: -1 }` - For filtered queries
- `{ userId: 1 }` - For user-based lookups

## Security

- All endpoints require authentication (JWT token)
- Users can only access their own activities
- Transaction hashes are validated
- Input validation on all parameters

## Future Enhancements

Potential improvements:

- Activity notifications
- Export activities to CSV
- Advanced filtering (date ranges, amount ranges)
- Activity analytics dashboard
- Real-time activity updates via WebSockets
