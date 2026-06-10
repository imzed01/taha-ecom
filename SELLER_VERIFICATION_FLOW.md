# Seller Verification Flow

## Overview
This document explains the complete seller verification flow, from signup to account activation.

## Flow Diagram

```
Seller Signup → Admin Review → Account Status → User Experience
     ↓              ↓              ↓              ↓
   Pending      Verify/Reject   Verified      Dashboard Access
     ↓              ↓              ↓              ↓
   Rejected      Rejection       Pending      Pending Page
     ↓              ↓              ↓              ↓
   Rejected      Rejection       Rejected     Rejected Page
```

## Detailed Flow

### 1. Seller Signup Process
- Seller fills out registration form with:
  - Email and password
  - Store name
  - **Front and back ID images** (new requirement)
- Account is created with `verificationStatus: "pending"`
- Seller is redirected to signin page

### 2. Seller Signin Process
- Seller enters credentials and selects "seller" role
- System authenticates the user
- **NEW**: System immediately checks verification status via `/api/seller/status`
- Based on status, seller is redirected to appropriate page:
  - `pending` → `/seller/pending`
  - `rejected` → `/seller/rejected`
  - `verified` → `/seller/dashboard`

### 3. Account Status Pages

#### Pending Page (`/seller/pending`)
- **Purpose**: Inform seller that their account is under review
- **Features**:
  - Clear explanation of the verification process
  - Step-by-step guide of what happens next
  - "Check Verification Status" button to manually refresh
  - Last checked timestamp
  - Sign out option
- **Auto-redirect**: If status changes to verified/rejected, user is automatically redirected

#### Rejected Page (`/seller/rejected`)
- **Purpose**: Inform seller that their account was rejected
- **Features**:
  - Display rejection reason (if provided)
  - Instructions on what to do next
  - "Check Verification Status" button (in case admin changes decision)
  - Last checked timestamp
  - Sign out option
- **Auto-redirect**: If status changes to verified/pending, user is automatically redirected

### 4. Admin Verification Process
- Admin can view all pending sellers at `/admin/sellers`
- Admin clicks "View Details" to see seller information and ID images
- Admin can:
  - **Approve**: Sets `verificationStatus: "verified"`
  - **Reject**: Sets `verificationStatus: "rejected"` with optional reason

### 5. Dashboard Access Control
- `DashboardLayout` component checks verification status for all seller routes
- Pending sellers are redirected to `/seller/pending`
- Rejected sellers are redirected to `/seller/rejected`
- Only verified sellers can access the main dashboard

## Key Improvements Made

### 1. Enhanced Signin Flow
- **Before**: Sellers with pending status would get stuck in loading state
- **After**: Immediate status check and proper routing to status-specific pages

### 2. Dedicated Status Pages
- **Pending Page**: Professional waiting page with clear expectations
- **Rejected Page**: Clear feedback with rejection reason and next steps

### 3. Real-time Status Checking
- Manual status refresh button on both pages
- Automatic redirects when status changes
- Last checked timestamp for user feedback

### 4. Better User Experience
- No more loading loops or stuck states
- Clear communication about account status
- Professional design with helpful information

## API Endpoints

### `/api/seller/status`
- **Method**: GET
- **Purpose**: Get current verification status
- **Response**:
  ```json
  {
    "verificationStatus": "pending" | "verified" | "rejected",
    "rejectionReason": "string" // only if rejected
  }
  ```

### `/api/admin/sellers/[id]/verify`
- **Method**: POST
- **Purpose**: Update seller verification status
- **Body**:
  ```json
  {
    "status": "verified" | "rejected",
    "rejectionReason": "string" // optional, for rejections
  }
  ```

## User Journey Examples

### Successful Verification
1. Seller signs up → Account created (pending)
2. Seller signs in → Redirected to pending page
3. Admin reviews and approves → Status changes to verified
4. Seller clicks "Check Status" → Redirected to dashboard
5. Seller can now access all features

### Rejected Account
1. Seller signs up → Account created (pending)
2. Seller signs in → Redirected to pending page
3. Admin reviews and rejects → Status changes to rejected
4. Seller clicks "Check Status" → Redirected to rejected page
5. Seller sees rejection reason and next steps

## Technical Implementation

### Authentication Flow
```typescript
// In signin page
const result = await signIn("credentials", { redirect: false });
if (result?.ok && selectedRole === "seller") {
  const statusResponse = await fetch("/api/seller/status");
  const statusData = await statusResponse.json();
  
  switch (statusData.verificationStatus) {
    case "pending":
      router.push("/seller/pending");
      break;
    case "rejected":
      router.push("/seller/rejected");
      break;
    case "verified":
      router.push("/seller/dashboard");
      break;
  }
}
```

### Dashboard Protection
```typescript
// In DashboardLayout
if (requiredRole === "seller" && user?.verificationStatus === "pending") {
  router.push("/seller/pending");
  return;
}

if (requiredRole === "seller" && user?.verificationStatus === "rejected") {
  router.push("/seller/rejected");
  return;
}
```

## Benefits

1. **No More Loading Loops**: Clear routing prevents stuck states
2. **Better User Communication**: Users know exactly what's happening
3. **Professional Experience**: Dedicated pages for each status
4. **Real-time Updates**: Manual status checking with feedback
5. **Clear Expectations**: Users know what to expect during verification
6. **Proper Error Handling**: Graceful handling of all verification states

## Future Enhancements

1. **Email Notifications**: Send emails when status changes
2. **Push Notifications**: Real-time status updates
3. **Auto-refresh**: Periodic status checking
4. **Support Chat**: Direct support access from status pages
5. **Re-application**: Allow rejected sellers to re-apply 