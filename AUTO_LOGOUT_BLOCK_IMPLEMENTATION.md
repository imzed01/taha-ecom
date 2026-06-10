# Auto-Logout and Redirect Implementation for Seller Blocking

## Overview
This document describes the implementation of automatic logout when sellers get blocked and automatic redirect when they get unblocked. The system provides real-time updates without requiring manual page refreshes.

## Features Implemented

### 1. Automatic Logout When Blocked
**File**: `/components/DashboardLayout.tsx`

**Implementation**:
- Real-time status checking every 30 seconds for sellers
- Immediate status check on component mount
- Automatic logout using `signOut()` when seller is detected as blocked
- Redirect to signin page with blocked message parameter

**Code Added**:
```typescript
// Real-time status checking for sellers
useEffect(() => {
  if (requiredRole !== "seller" || status === "loading" || !session) return;

  const checkSellerStatus = async () => {
    try {
      const response = await fetch("/api/seller/status");
      if (response.ok) {
        const data = await response.json();
        
        // If seller is now blocked, force logout
        if (data.isBlocked) {
          console.log("Seller blocked - forcing logout");
          await signOut({ 
            callbackUrl: "/auth/signin?role=seller&message=blocked",
            redirect: true 
          });
          return;
        }

        // Handle verification status changes
        if (data.verificationStatus === "pending") {
          router.push("/seller/pending");
          return;
        } else if (data.verificationStatus === "rejected") {
          router.push("/seller/rejected");
          return;
        }
      }
    } catch (error) {
      console.error("Error checking seller status:", error);
    }
  };

  // Check status immediately
  checkSellerStatus();

  // Set up interval to check status every 30 seconds
  const interval = setInterval(checkSellerStatus, 30000);

  return () => clearInterval(interval);
}, [session, status, requiredRole, router]);
```

**Flow**:
1. Seller is logged in and on any dashboard page
2. Admin blocks the seller from admin panel
3. Within 30 seconds, DashboardLayout detects the blocking via API call
4. Seller is automatically logged out and redirected to signin page
5. Signin page shows "Your account has been blocked" message

### 2. Blocked Message on Signin Page
**File**: `/app/auth/signin/page.tsx`

**Implementation**:
- Added URL parameter detection for blocked message
- Shows toast notification when redirected due to blocking
- Enhanced signin logic to handle blocked sellers

**Code Added**:
```typescript
const searchParams = useSearchParams();

// Show message if redirected due to blocking
useEffect(() => {
  const message = searchParams?.get("message");
  if (message === "blocked") {
    toast.error("Your account has been blocked. Please contact support.", {
      duration: 5000,
    });
  }
}, [searchParams]);

// Enhanced signin logic
if (statusData.isBlocked) {
  router.push("/seller/blocked");
} else if (statusData.verificationStatus === "pending") {
  // ... other status checks
}
```

### 3. Auto-Redirect from Blocked Page (Already Implemented)
**File**: `/app/seller/blocked/page.tsx`

**Existing Features**:
- ✅ Automatic status checking every 15 seconds
- ✅ **IMMEDIATE** status check on page load/refresh
- ✅ Auto-redirect to dashboard when unblocked
- ✅ Auto-redirect based on verification status changes
- ✅ Chat Support integration
- ✅ Manual "Check Block Status" button

**Auto-redirect Scenarios**:
- `isBlocked: false` = Redirect to `/seller/dashboard`
- `verificationStatus: "pending"` = Redirect to `/seller/pending`
- `verificationStatus: "rejected"` = Redirect to `/seller/rejected`

## API Integration

### Status API Endpoint
**File**: `/app/api/seller/status/route.ts`

**Response Format**:
```json
{
  "verificationStatus": "verified",
  "rejectionReason": null,
  "isBlocked": false,
  "blockedReason": null
}
```

**When Blocked**:
```json
{
  "verificationStatus": "verified",
  "rejectionReason": null,
  "isBlocked": true,
  "blockedReason": "Account suspended for policy violation"
}
```

### Admin Block/Unblock API
**File**: `/app/api/admin/sellers/[id]/block/route.ts`

**Request Format**:
```json
{
  "action": "block",
  "reason": "Policy violation"
}
```

**Response Format**:
```json
{
  "message": "Seller blocked successfully",
  "isBlocked": true,
  "blockedReason": "Policy violation"
}
```

## Complete User Flow

### Blocking Flow
1. **Admin Action**: Admin blocks seller from admin panel
2. **Database Update**: Seller's `isBlocked` field set to `true`
3. **Real-time Detection**: DashboardLayout detects blocking within 30 seconds
4. **Automatic Logout**: Seller is logged out automatically
5. **Redirect with Message**: Seller redirected to signin with blocked message
6. **User Notification**: Toast shows "Your account has been blocked"

### Unblocking Flow
1. **Admin Action**: Admin unblocks seller from admin panel
2. **Database Update**: Seller's `isBlocked` field set to `false`
3. **Blocked Page Detection**: If seller is on blocked page, detects unblocking within 15 seconds
4. **Automatic Redirect**: Seller redirected to dashboard
5. **Success Message**: Toast shows "Your account has been unblocked!"

## Testing

### Manual Testing Steps
1. **Setup**: Use test seller (testseller@example.com / password123)
2. **Login**: Seller logs in and accesses dashboard
3. **Block**: Admin blocks the seller
4. **Verify Auto-Logout**: Within 30 seconds, seller should be logged out
5. **Verify Message**: Signin page should show blocked message
6. **Unblock**: Admin unblocks the seller
7. **Verify Redirect**: If on blocked page, seller should be redirected to dashboard within 15 seconds

### Test Scripts
- `scripts/setup-test-seller-for-blocking.mjs`: Sets up test seller
- `scripts/test-auto-logout-block.mjs`: Tests the blocking functionality

### Test Results
✅ **Block Detection**: Real-time detection working (30s interval)
✅ **Auto-Logout**: Automatic logout implemented
✅ **Blocked Message**: Message display on signin page
✅ **Auto-Redirect**: Redirect from blocked page when unblocked (15s interval)
✅ **Database Integration**: All database operations working correctly

## Performance Considerations

### Polling Intervals
- **DashboardLayout**: 30 seconds (balance between responsiveness and server load)
- **Blocked Page**: 15 seconds (more frequent as user is waiting for unblocking)
- **Immediate Checks**: On page load/mount for instant feedback

### API Optimization
- Lightweight status API endpoint
- Only checks status for sellers (not admins)
- Efficient database queries using indexed fields

### Memory Management
- Proper cleanup of intervals on component unmount
- No memory leaks in polling implementations

## Security Considerations

### Session Management
- Proper logout using NextAuth's `signOut()`
- JWT token invalidation
- Secure redirect URLs

### API Security
- Authentication required for all status endpoints
- Role-based access control
- Input validation and sanitization

## Future Enhancements

### Real-time Updates (Optional)
- WebSocket integration for instant notifications
- Server-sent events for real-time status updates
- Push notifications for mobile apps

### Enhanced User Experience
- Progressive loading states
- Offline detection and handling
- Retry mechanisms for failed API calls

## Conclusion

The auto-logout and redirect implementation provides a seamless user experience when sellers get blocked or unblocked. The system balances real-time responsiveness with performance considerations, ensuring sellers are immediately notified of status changes while maintaining efficient server resource usage.

**Key Benefits**:
- ✅ Real-time status detection
- ✅ Automatic session management
- ✅ User-friendly notifications
- ✅ Seamless redirect handling
- ✅ Performance optimized
- ✅ Security compliant 