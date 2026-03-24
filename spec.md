# ClikMate Service Center

## Current State
The 'Live Dashboard' tab in AdminDashboard.tsx shows a `DashboardSection` component that displays Catalog stats (Items Published, Total Catalog, Categories, Hidden Items) and a "Recent Catalog Activity" list. It has no order data, no revenue metrics, and no print functionality.

## Requested Changes (Diff)

### Add
- 4 clickable operational stat cards: New Orders (Pending), Ready for Print/Processing, Out for Delivery/Pickup, Today's Revenue
- Dynamic data table below the cards showing orders, filterable by card click
- Table columns: Order ID, Customer Name, Service Detail, Amount, Status, Action
- Action column with quick status-change buttons (Accept Order, Mark as Ready, etc.) based on current order status
- "🖨️ Print Report (A4)" primary button at top right
- @media print CSS: hide sidebar/dark background, show clean B&W header "ClikMate - Daily Operations Report [Date]", A4-optimized table

### Modify
- Replace existing `DashboardSection` component (catalog stats) with new `LiveOperationalDashboard` component

### Remove
- Old catalog-stats-based dashboard content from the Live Dashboard tab

## Implementation Plan
1. Create `LiveOperationalDashboard` component inside AdminDashboard.tsx
2. Fetch all orders using `getAllShopOrders()` on mount
3. Compute 4 metrics from order data: pending count, processing count, out-for-delivery count, today's revenue (sum of today's completed/all orders' totalAmount)
4. Track `activeFilter` state: null | 'pending' | 'processing' | 'delivery' | 'revenue'
5. Filter displayed orders based on activeFilter
6. Each row: show first item name as Service Detail, quick action button that calls `updateShopOrderStatus`
7. Print button calls `window.print()`, inject `<style id="print-styles">` with @media print rules hiding sidebar and dark bg, showing clean header
8. Replace `DashboardSection` usage in the Live Dashboard tab with `LiveOperationalDashboard`
