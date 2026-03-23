# ClikMate Service Center

## Current State
- Rider Dashboard at `/#/rider` shows hardcoded dummy orders with OTP `1234`
- Rider login accepts any mobile/PIN without backend verification
- Backend `ShopOrder` type has no `deliveryOtp` field
- No rider account management in backend or admin dashboard
- No public API to fetch orders filtered by status
- `updateShopOrderStatus` is admin-only and does not generate OTPs
- Admin dashboard has no "Team & Access" tab for rider management
- Status options in admin do not include "Ready for Delivery"

## Requested Changes (Diff)

### Add
- Backend: `Rider` type `{name: Text; mobile: Text; pin: Text}`
- Backend: rider store, `addRider` (admin), `removeRider` (admin), `getRiders` (admin), `verifyRider(mobile, pin)` (public)
- Backend: `deliveryOtp` field to `ShopOrder` type
- Backend: `getReadyForDeliveryOrders()` - public query returning orders with status "Ready for Delivery"
- Backend: `markOrderDelivered(orderId: Nat, otp: Text)` - public, verifies OTP then sets status to "Delivered"
- Admin Dashboard: "Team & Access" nav section with rider management (add/remove riders)
- Admin Dashboard: "Ready for Delivery" added to `SHOP_ORDER_STATUSES`

### Modify
- Backend: `updateShopOrderStatus` - when setting status to "Ready for Delivery", auto-generate 4-digit OTP and store in `deliveryOtp`
- Rider Dashboard login: call `verifyRider(mobile, pin)` instead of accepting any credentials
- Rider Dashboard orders list: fetch from `getReadyForDeliveryOrders()` instead of dummy data
- Rider Dashboard OTP confirm: call `markOrderDelivered(orderId, otp)` instead of checking hardcoded OTP
- Remove demo hint text from login and OTP modal

### Remove
- Hardcoded `INITIAL_DELIVERIES` dummy data from RiderDashboard
- Hardcoded OTP `1234` check

## Implementation Plan
1. Update `ShopOrder` type to include `deliveryOtp: Text`
2. Add `Rider` type and rider store with CRUD + verifyRider functions to main.mo
3. Update `updateShopOrderStatus` to auto-generate 4-digit OTP on "Ready for Delivery"
4. Add public `getReadyForDeliveryOrders()` query
5. Add public `markOrderDelivered(orderId, otp)` mutation
6. Regenerate backend bindings
7. Add "Ready for Delivery" to admin status dropdown
8. Add "Team & Access" tab to admin dashboard with rider management UI
9. Rewrite RiderDashboard to use real backend calls
