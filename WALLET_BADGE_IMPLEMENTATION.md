# Wallet Badge Implementation

## Overview
This implementation adds badge notifications for pending wallet requests (withdrawal and funding) on both admin and seller sides of the application.

## Features Implemented

### 1. Admin Side Badges
- **Wallet Navigation Badge**: Shows total count of pending withdrawal and funding requests
- **Real-time Updates**: Badge updates when requests are approved/rejected
- **Orange Color**: Uses orange background to distinguish from other badges

### 2. Seller Side Badges
- **Wallet Navigation Badge**: Shows count of seller's own pending requests
- **Wallet Updates Badge**: Shows count of approved/rejected requests the seller hasn't seen yet
- **Real-time Updates**: Badge updates when new requests are submitted or processed
- **Orange Color**: For pending requests
- **Green Color**: For request updates (approved/rejected)

## API Endpoints Created

### Admin Endpoints
- **Route**: `/api/admin/total-pending-wallet-requests`
- **Method**: GET
- **Purpose**: Count all **unseen** pending wallet requests across all sellers
- **Response**:
  ```json
  {
    "totalPendingRequests": 5,
    "pendingFundingRequests": 3,
    "pendingWithdrawalRequests": 2
  }
  ```

- **Route**: `/api/admin/mark-wallet-requests-seen`
- **Method**: POST
- **Purpose**: Mark all pending wallet requests as seen by admin
- **Response**:
  ```json
  {
    "message": "Wallet requests marked as seen",
    "success": true
  }
  ```

### Seller Endpoints
- **Route**: `/api/seller/total-pending-wallet-requests`
- **Method**: GET
- **Purpose**: Count **unseen** pending wallet requests for the authenticated seller
- **Response**:
  ```json
  {
    "totalPendingRequests": 2,
    "pendingFundingRequests": 1,
    "pendingWithdrawalRequests": 1
  }
  ```

- **Route**: `/api/seller/mark-wallet-requests-seen`
- **Method**: POST
- **Purpose**: Mark seller's pending wallet requests as seen
- **Response**:
  ```json
  {
    "message": "Wallet requests marked as seen",
    "success": true
  }
  ```

- **Route**: `/api/seller/total-wallet-request-updates`
- **Method**: GET
- **Purpose**: Count approved/rejected wallet requests that seller hasn't seen
- **Response**:
  ```json
  {
    "totalUpdates": 3,
    "fundingUpdates": 2,
    "withdrawalUpdates": 1
  }
  ```

- **Route**: `/api/seller/mark-wallet-updates-seen`
- **Method**: POST
- **Purpose**: Mark seller's wallet request updates as seen
- **Response**:
  ```json
  {
    "message": "Wallet request updates marked as seen",
    "success": true
  }
  ```

## Components Updated

### 1. Sidebar Component (`components/Sidebar.tsx`)
- Added `totalPendingWalletRequests` state
- Added wallet badge fetching logic
- Added wallet badge event listeners
- Updated navigation items to show wallet badges
- Added badge display logic for both desktop and mobile views

### 2. Admin Wallet Page (`app/admin/wallet/page.tsx`)
- Added badge update triggers when requests are approved/rejected
- Dispatches `updateWalletBadge` custom events

### 3. Seller Wallet Page (`app/seller/wallet/page.tsx`)
- Added badge update triggers when new requests are submitted
- Dispatches `updateWalletBadge` custom events

## Badge Behavior

### Display Rules
- **Admin**: Shows total **unseen** pending requests from all sellers
- **Seller**: Shows only their own **unseen** pending requests
- **Seller Updates**: Shows approved/rejected requests the seller hasn't seen yet
- **Colors**: 
  - Orange (`bg-orange-500`) for pending requests
  - Green (`bg-green-500`) for request updates (approved/rejected)
- **Position**: Top-right corner of wallet icon
- **Hide When**: User is on wallet page (`!pathname?.includes("/wallet")`)

### "Mark as Seen" Functionality
- **Automatic**: When user visits wallet page, all pending requests are marked as "seen"
- **Persistent**: Badge only reappears when new requests are submitted
- **Role-based**: Admin and seller have separate "seen" tracking
- **Real-time**: Badge disappears immediately when wallet page is visited

### Update Triggers
- **Real-time**: Polling every 30 seconds
- **On Action**: When admin approves/rejects requests
- **On Submit**: When seller submits new requests
- **Custom Events**: `updateWalletBadge` event for immediate updates

## Database Queries

### Funding Requests (Unseen)
```javascript
WalletTransaction.countDocuments({
  type: { $in: ["topup", "funding_request"] },
  status: "pending",
  seenByAdmin: { $ne: true } // or seenBySeller for seller endpoints
})
```

### Withdrawal Requests (Unseen)
```javascript
WithdrawalRequest.countDocuments({
  status: "pending",
  seenByAdmin: { $ne: true } // or seenBySeller for seller endpoints
})
```

### Seller-Specific Requests
```javascript
// Add sellerId filter for seller endpoints
{ sellerId: sellerId }
```

### Mark as Seen Queries
```javascript
// Mark funding requests as seen
WalletTransaction.updateMany(
  {
    type: { $in: ["topup", "funding_request"] },
    status: "pending",
    seenByAdmin: { $ne: true } // or seenBySeller
  },
  { $set: { seenByAdmin: true } } // or seenBySeller
)

// Mark withdrawal requests as seen
WithdrawalRequest.updateMany(
  {
    status: "pending",
    seenByAdmin: { $ne: true } // or seenBySeller
  },
  { $set: { seenByAdmin: true } } // or seenBySeller
)
```

## Testing

### Manual Testing
1. **Admin Side**:
   - Submit funding/withdrawal requests as seller
   - Check admin sidebar shows orange badge
   - Approve/reject requests and verify badge updates

2. **Seller Side**:
   - Submit funding/withdrawal requests
   - Check seller sidebar shows orange badge
   - Verify badge disappears when requests are processed

### Automated Testing
- **Check existing requests**: `node scripts/check-wallet-requests.mjs`
- **Create test requests**: `node scripts/create-test-wallet-requests.mjs`
- **Create test updates**: `node scripts/create-test-wallet-updates.mjs`
- **Cleanup test requests**: `node scripts/cleanup-test-wallet-requests.mjs`
- **Cleanup test updates**: `node scripts/cleanup-test-wallet-updates.mjs`
- Tests API endpoints and badge counting logic
- Creates and cleans up test data

## Security Considerations

- **Authentication**: All endpoints require proper authentication
- **Authorization**: Admin endpoints check admin role
- **Seller Isolation**: Seller endpoints only show their own requests
- **Input Validation**: All request data is validated

## Performance Considerations

- **Polling**: 30-second intervals for real-time updates
- **Efficient Queries**: Uses `countDocuments()` for performance
- **Caching**: Badge counts are cached in component state
- **Cleanup**: Event listeners are properly removed

## Future Enhancements

1. **WebSocket Integration**: Real-time updates without polling
2. **Badge Categories**: Separate badges for funding vs withdrawal
3. **Notification Settings**: Allow users to configure badge preferences
4. **Badge History**: Track badge interactions and analytics

## Files Modified

1. `app/api/admin/total-pending-wallet-requests/route.ts` (NEW)
2. `app/api/seller/total-pending-wallet-requests/route.ts` (NEW)
3. `app/api/admin/mark-wallet-requests-seen/route.ts` (NEW)
4. `app/api/seller/mark-wallet-requests-seen/route.ts` (NEW)
5. `models/WalletTransaction.ts` (UPDATED - added seenByAdmin, seenBySeller fields)
6. `models/WithdrawalRequest.ts` (UPDATED - added seenByAdmin, seenBySeller fields)
7. `components/Sidebar.tsx` (UPDATED)
8. `app/admin/wallet/page.tsx` (UPDATED)
9. `app/seller/wallet/page.tsx` (UPDATED)
10. `scripts/check-wallet-requests.mjs` (NEW)
11. `scripts/create-test-wallet-requests.mjs` (NEW)
12. `scripts/create-test-wallet-updates.mjs` (NEW)
13. `scripts/cleanup-test-wallet-requests.mjs` (NEW)
14. `scripts/cleanup-test-wallet-updates.mjs` (NEW)
15. `scripts/test-wallet-badge-seen.mjs` (NEW)
16. `WALLET_BADGE_IMPLEMENTATION.md` (NEW)

## Usage

The wallet badge system is now fully functional and will automatically:
- Show pending request counts in the sidebar
- Update in real-time when requests are processed
- Provide visual feedback for both admins and sellers
- Maintain consistency with existing badge patterns 