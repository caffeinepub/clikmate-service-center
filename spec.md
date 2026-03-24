# ClikMate Service Center

## Current State
AdminDashboard.tsx (9381 lines) contains multiple form submission handlers that follow a blocking pattern: `await backend call → then update UI`. If the backend is slow or fails, the table never updates. Key affected handlers:

- `handleAddMember` in `TeamAccessSection` (line ~5583): calls `addTeamMember`, then calls `loadMembers()` to refresh. No optimistic update.
- `handleAddIncome` in AccountsSection (line ~7160): calls `addManualIncome`, then `loadData()`
- `handleAddExpense` (line ~7197): calls `addExpense`, then `loadData()`
- Catalog `handleSave` in modal (line ~566): calls `addCatalogItem` / `updateCatalogItem`, then `onSaved()`

## Requested Changes (Diff)

### Add
- Optimistic update logic to all key form submissions: immediately mutate local state, fire backend async, revert + show red error toast on failure
- Explicit error messaging: catch block must extract `err.message` and display it in toast (not generic text)

### Modify
- `handleAddMember`: Add optimistic member to `members` state immediately with `{ name, mobile, pin, role }`. Fire `addTeamMember` in background. On success: do nothing extra (already in state). On failure: revert by removing the optimistic entry from `members`, show red error toast with exact error message. Clear form and show success toast immediately after optimistic add (not after await).
- `handleAddIncome`: Add optimistic income entry to `incomes` state with a temporary negative BigInt ID. Fire `addManualIncome` in background. On failure: revert + show red error toast.
- `handleAddExpense`: Same pattern — add optimistic expense entry to `expenses` with temp negative BigInt ID. Fire `addExpense` in background. On failure: revert + show red toast.
- Catalog `handleSave` (add mode only): Add optimistic item with temp BigInt ID. On failure: revert + show error.

### Remove
- `await loadMembers()` / `await loadData()` / `onSaved()` calls that trigger full refresh AFTER submission (replaced by optimistic direct state mutation)

## Implementation Plan
1. In `TeamAccessSection.handleAddMember`:
   - Build `optimisticMember = { name: name.trim(), mobile, pin, role }`
   - Call `setMembers(prev => [optimisticMember, ...prev])` immediately
   - Clear form fields and show success toast immediately
   - Fire backend call WITHOUT await (fire-and-forget with catch)
   - In catch: `setMembers(prev => prev.filter(m => m.mobile !== mobile))` + `toast.error('Failed: ' + msg)`
   - Remove the final `await loadMembers()` from success path

2. In `handleAddExpense` (add mode):
   - Build `optimisticExpense` with `id: BigInt(-Date.now())`, fields from form
   - `setExpenses(prev => [optimisticExpense, ...prev])` immediately
   - Close modal, clear form, show success toast immediately
   - Fire `addExpense` without await
   - On error: revert via filter on temp id + show exact error

3. In `handleAddIncome` (add mode):
   - Same pattern as expense

4. In catalog `handleSave` (non-edit path):
   - Build optimistic CatalogItem with temp BigInt ID
   - Call `onSaved()` callback immediately (so parent refreshes or adds to list)
   - Fire backend without await
   - On error: show error toast (parent will re-fetch to correct state)
   - NOTE: This one is more complex due to blob uploads — only apply optimistic pattern AFTER file uploads complete; the optimistic part is just the state update after backend prepare

5. In `EducatorServicesSection.handleSubmit` (B2B form): already works — file is saved as filename string. No changes needed unless testing shows issues.
