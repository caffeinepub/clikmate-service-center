# ClikMate Service Center

## Current State
- `Rider` type has: name, mobile, pin, role — NO baseSalary field
- Attendance saves to localStorage only, no backend persistence
- Team table has Pay Salary column (amount input + Pay button) but no Salary Due column
- Pay Salary calls `addExpense()` under "Staff Salary & Payroll" — no staff ledger
- No staff ledger DB or modal exists
- No backend functions for attendance or staff ledger

## Requested Changes (Diff)

### Add
- `baseSalary` field on `Rider` type in backend
- `AttendanceRecord` type: { mobile, date, status (Present/Absent/Half-Day) }
- `StaffLedgerEntry` type: { id, mobile, date, description, amount, entryType ("earned"|"paid") }
- `addAttendanceRecord(mobile, date, status)` backend function
- `getAttendanceForMobile(mobile)` backend function  
- `addStaffLedgerEntry(mobile, date, description, amount, entryType)` backend function
- `getStaffLedgerEntries(mobile)` backend function
- `updateRiderSalary(mobile, baseSalary)` backend function
- `Salary Due (₹)` column in Active Team Members table — real-time calculated
- Staff Ledger Modal: clickable staff name → modal showing Date, Description, Amount, Running Balance columns
- Print Ledger Statement button in Staff Ledger Modal (A4 format)
- When attendance is saved (Daily Attendance tab), also call backend `addAttendanceRecord` for each staff and add staff ledger "Attendance Earned" entry
- When Pay is clicked: call `addStaffLedgerEntry` with "Salary Paid" + existing `addExpense` call
- `baseSalary` field in Add Team Member form

### Modify
- `addTeamMember` backend to accept and store `baseSalary` 
- `DailyAttendanceTab` save handler: also persist to backend and add earned entries to staff ledger
- `handlePaySalary`: also add entry to staff ledger
- Team table to add `Salary Due (₹)` column before Pay Action column

### Remove
- Nothing removed

## Implementation Plan
1. Update backend: new `Rider` type with baseSalary, new AttendanceRecord and StaffLedgerEntry types, new storage maps, new functions for attendance CRUD, staff ledger CRUD, updateRiderSalary
2. Update `addTeamMember` to accept baseSalary parameter
3. Frontend: add baseSalary input to Add Team Member form
4. Frontend: load attendance from backend; when saving attendance, fire backend calls + inject earned ledger entries
5. Frontend: compute `salaryDue` per member (baseSalary/30 * presentDaysThisMonth - paidThisMonth from staff ledger)
6. Frontend: add Salary Due column to table (red if > 0)
7. Frontend: make staff name clickable → Staff Ledger Modal with transaction table + print button
8. Frontend: on Pay click, also add staff ledger entry
