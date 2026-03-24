# ClikMate Service Center

## Current State
- `/#/bulk-dashboard` is a placeholder "Coming Soon" page with zero authentication
- B2B leads stored via `TypesettingQuoteRequest` type (id, name, phone, subject, format, language, fileUrl, status, submittedAt)
- No `finalPdfUrl`, `quoteNotes` fields on B2B leads
- No `verifyBulkStaff` backend function (verifyStaff only checks Shop Staff role)
- No `bulkSession` localStorage key or Bulk Staff login screen
- Kanban statuses currently: "Pending Quote", "Quote Sent", "Confirmed", "Printing"

## Requested Changes (Diff)

### Add
- `verifyBulkStaff(mobile, pin)` backend function — checks role == "Bulk Printing Staff"
- `finalPdfUrl` and `quoteNotes` fields on `TypesettingQuoteRequest`
- `updateLeadFinalPdf(id, finalPdfUrl)` backend function
- `updateLeadQuoteNotes(id, notes)` backend function
- `BulkLoginPage.tsx` at `/#/bulk-login` — Mobile + PIN form, verifies Bulk Printing Staff role, saves `bulkSession` to localStorage
- Full `BulkDashboard.tsx` — strict route guard, Kanban board (4 columns), drag-and-drop status update, order detail modal with side-by-side PDF viewer
- New route `/#/bulk-login` in App.tsx router

### Modify
- `BulkDashboard.tsx` — replace placeholder with full VIP portal
- `TeamPortalPage.tsx` — update Bulk Printing Staff card link from `/#/bulk-dashboard` to `/#/bulk-login` for new staff login flow
- Backend `TypesettingQuoteRequest` type: add `finalPdfUrl: Text` and `quoteNotes: Text` fields
- `updateTypesettingQuoteStatus` to support new Kanban status values: "Pending Quote", "Quote Sent & Confirmed", "Typesetting in Progress", "Ready for Print & Delivery"

### Remove
- "Coming Soon" placeholder content from BulkDashboard

## Implementation Plan
1. Backend: Add `finalPdfUrl` and `quoteNotes` to `TypesettingQuoteRequest`; add `verifyBulkStaff`, `updateLeadFinalPdf`, `updateLeadQuoteNotes` functions
2. Create `BulkLoginPage.tsx`: Mobile + PIN form calling `verifyBulkStaff`, saving `bulkSession: {mobile, loggedInAt}` to localStorage, redirecting to `/#/bulk-dashboard`
3. Rewrite `BulkDashboard.tsx`:
   - Route guard: check `bulkSession` localStorage; if missing or role not Bulk Staff/Admin, redirect to `/#/portal`
   - Fetch all B2B leads via `getAllTypesettingQuotes()`
   - Kanban board with 4 columns (HTML5 drag-and-drop API)
   - Order card: Institute Name, Subject, Layout, Date
   - On card click: full-screen modal with Formatting Specs panel + side-by-side PDF viewer (iframe embed for raw file left, upload zone + preview for final PDF right)
   - Final PDF upload: upload to blob-storage, then call `updateLeadFinalPdf(id, url)` to persist permanently
   - "Send Proof via WhatsApp" button: auto-generate wa.me link using lead's phone from DB, with small edit-icon override
4. Add routes to App.tsx
5. Update TeamPortalPage bulk staff card to link to `/#/bulk-login`
