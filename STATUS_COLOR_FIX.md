# Status Color Fix for Admin Sellers Page

## Issue
The "verified" status was not displaying in green color on the admin sellers page at `http://localhost:3000/admin/sellers`.

## Root Cause
The `getStatusColor` function was using CSS custom properties (`text-success`, `bg-success/20`) that were not properly defined or were being overridden.

## Solution
Updated the `getStatusColor` function in `/app/admin/sellers/page.tsx` to use standard Tailwind CSS classes:

### Before:
```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "text-warning bg-warning/20";
    case "verified":
      return "text-success bg-success/20";  // Not working properly
    case "rejected":
      return "text-destructive bg-destructive/20";
    default:
      return "text-muted-foreground bg-muted";
  }
};
```

### After:
```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "text-yellow-600 bg-yellow-100 border-yellow-200";
    case "verified":
      return "text-green-600 bg-green-100 border-green-200";  // ✅ Now green
    case "rejected":
      return "text-red-600 bg-red-100 border-red-200";
    default:
      return "text-gray-600 bg-gray-100 border-gray-200";
  }
};
```

## Color Scheme
- **Pending**: Yellow (`text-yellow-600 bg-yellow-100 border-yellow-200`)
- **Verified**: Green (`text-green-600 bg-green-100 border-green-200`) ✅
- **Rejected**: Red (`text-red-600 bg-red-100 border-red-200`)

## Files Modified
- `/app/admin/sellers/page.tsx` - Updated `getStatusColor` function

## Result
The "verified" status now displays in green color in the seller verification requests table, providing clear visual distinction between different verification statuses.

## Testing
1. Navigate to `http://localhost:3000/admin/sellers`
2. Look for sellers with "verified" status
3. Verify they display with green color scheme
4. Confirm other statuses (pending = yellow, rejected = red) also display correctly 