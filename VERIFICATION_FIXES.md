# Verification Status and Rejection Reason Fixes

## Issues Identified and Fixed

### Issue 1: Admin Sees Pending Status After Rejection
**Problem**: When admin rejects a seller account, the admin page still shows "pending" status instead of "rejected".

**Root Cause**: The admin sellers API had a 5-minute cache, causing stale data to be displayed.

**Solution Implemented**:
1. **Reduced Cache Duration**: Changed from 5 minutes to 1 minute in `/api/admin/sellers/route.ts`
2. **Added Cache Busting**: Modified `fetchSellers()` to include timestamp parameter
3. **Added Refresh Button**: Manual refresh option for admins

**Code Changes**:
```typescript
// Before: 5-minute cache
response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300");

// After: 1-minute cache
response.headers.set("Cache-Control", "public, max-age=60, s-maxage=60");

// Added cache busting
const response = await fetch("/api/admin/sellers?t=" + Date.now());
```

### Issue 2: Rejection Reason Not Displayed
**Problem**: When admin rejects a seller with a reason, the rejection reason is not displayed on the seller's rejected page.

**Root Cause**: The rejected page was trying to get rejection reason from session data, but session doesn't include this information.

**Solution Implemented**:
1. **API Integration**: Added `fetchRejectionReason()` function to call `/api/seller/status`
2. **State Management**: Added `rejectionReason` and `isLoadingReason` states
3. **Loading State**: Added loading indicator while fetching rejection reason
4. **Error Handling**: Graceful fallback if API call fails

**Code Changes**:
```typescript
// Added state variables
const [rejectionReason, setRejectionReason] = useState<string>("");
const [isLoadingReason, setIsLoadingReason] = useState(true);

// Added fetch function
const fetchRejectionReason = async () => {
  try {
    const response = await fetch("/api/seller/status");
    if (response.ok) {
      const data = await response.json();
      setRejectionReason(data.rejectionReason || "No specific reason provided");
    }
  } catch (error) {
    setRejectionReason("Failed to load rejection reason");
  } finally {
    setIsLoadingReason(false);
  }
};

// Updated display logic
{isLoadingReason ? (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mr-3"></div>
    <p className="text-red-800 text-lg">Loading rejection reason...</p>
  </div>
) : (
  <p className="text-red-800 text-lg">
    {rejectionReason || "No specific reason provided..."}
  </p>
)}
```

## Files Modified

### 1. `/api/admin/sellers/route.ts`
- Reduced cache duration from 5 minutes to 1 minute
- Ensures faster updates when admin changes verification status

### 2. `/app/admin/sellers/page.tsx`
- Added cache busting parameter to API calls
- Added refresh button with loading state
- Imported RefreshCw icon

### 3. `/app/seller/rejected/page.tsx`
- Added rejection reason state management
- Added API call to fetch rejection reason
- Added loading state for rejection reason
- Updated display logic to show fetched reason

## How It Works Now

### Admin Workflow:
1. Admin views pending sellers
2. Admin clicks "View Details" to see seller information
3. Admin rejects seller with reason
4. Admin can click "Refresh" button to see updated status immediately
5. Status changes from "pending" to "rejected" within 1 minute

### Seller Workflow:
1. Seller signs in with rejected account
2. Seller is redirected to `/seller/rejected`
3. Page automatically fetches rejection reason from API
4. Rejection reason is displayed with loading state
5. Seller can see exactly why their account was rejected

## Benefits

1. **Real-time Updates**: Admin sees status changes much faster
2. **Manual Refresh**: Admin can force refresh if needed
3. **Clear Communication**: Sellers see specific rejection reasons
4. **Better UX**: Loading states and error handling
5. **Reliable Data**: API-driven rejection reason display

## Testing

To test the fixes:

1. **Admin Rejection Test**:
   - Admin rejects a seller with a reason
   - Click "Refresh" button on admin page
   - Verify status changes from "pending" to "rejected"

2. **Rejection Reason Test**:
   - Seller with rejected account visits `/seller/rejected`
   - Verify rejection reason is displayed
   - Check loading state appears briefly

3. **Cache Test**:
   - Wait 1 minute after rejection
   - Verify admin page shows updated status without manual refresh 