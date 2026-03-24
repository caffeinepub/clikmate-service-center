# ClikMate Service Center

## Current State
- AdminDashboard has two order tables: Print Orders (OrdersSection using OrderRecord) and Active Orders (ActiveOrdersSection using ShopOrder)
- Print Orders table: columns are Order ID, Customer, Service, Status, Date, Files. Files column shows plain text count only. No status dropdown — status is a static badge via OrderStatusBadge.
- Active Orders table: columns are Order ID, Customer, Phone, Items, Total, Delivery, Payment, Status, Time. Status column already contains a <select> dropdown calling handleStatusChange → actor.updateShopOrderStatus. Files only shown for CSC orders in an expandable row. No dedicated Actions column.
- OrderStatusBadge is missing color mappings for: Ready for Delivery, Completed, Cancelled, Processing/Printing.

## Requested Changes (Diff)

### Add
- Actions column (far right) in both Print Orders and Active Orders tables
- Status dropdown in Actions column for Print Orders — calls actor.updateOrderStatus(id, status), then refreshes list and updates badge live
- File download/view button in Actions column for both tables: for Print Orders, iterate uploadedFiles ExternalBlob array calling getDirectURL(); for Active Orders, show for all orders that have cscDocuments (already rendered in expandable row, should also be accessible via button in Actions column)
- Color mappings in OrderStatusBadge for missing statuses: Processing/Printing (blue), Ready for Delivery (indigo), Completed (green), Cancelled (red)
- Color mappings in ShopOrderStatusBadge ensure Completed is mapped

### Modify
- Print Orders table: add Actions column header, add Actions cell per row
- Active Orders table: add Actions column header, move status dropdown from Status column into new Actions column (or keep Status column with badge + add Actions column with dropdown + file button)
- SHOP_ORDER_STATUSES constant: ensure it contains exactly: Pending, Processing/Printing, Ready for Pickup, Ready for Delivery, Completed, Cancelled (rename Printing → Processing/Printing, add Completed)
- ACTIVE_STATUSES filter: keep orders visible until Completed or Cancelled (add Completed if needed, or leave as is)

### Remove
- Nothing removed

## Implementation Plan
1. Update SHOP_ORDER_STATUSES: [Pending, Processing/Printing, Ready for Pickup, Ready for Delivery, Completed, Cancelled]
2. Update OrderStatusBadge colormap with all statuses including Processing/Printing, Ready for Delivery, Completed, Cancelled
3. Print Orders table: add Actions column header; in each row add Actions cell with (a) status <select> dropdown that calls actor.updateOrderStatus(order.id, newStatus) then updates local state, and (b) View Files button — opens a small modal/popover listing each file as a clickable link via getDirectURL()
4. Active Orders table: add Actions column header; in each row add Actions cell with (a) the existing status dropdown (moved from Status column, leave Status column as static badge), and (b) View Files button — visible when cscDocuments.length > 0, opens same file viewer modal. For non-CSC orders without files, show a dash or disabled state.
5. Ensure 'Ready for Delivery' status change is reflected instantly (already handled by global state refresh via getAllShopOrders).
