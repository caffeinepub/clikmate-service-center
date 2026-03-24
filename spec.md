# ClikMate Service Center

## Current State
Admin Dashboard at `/#/admin` has a two-step authentication:
1. **Internet Identity (ICP)** login as Step 1 (if `identity` is null, show II login screen)
2. **Master Key password** (`CLIKMATE-ADMIN-2024`) as Step 2 (`AdminInitScreen` component)

The current system depends on `useInternetIdentity` hook and ICP identity. Users have been locked out repeatedly. The Settings tab currently only has UPI payment settings.

## Requested Changes (Diff)

### Add
- New `AdminLoginScreen` component: professional email + password form with "Smart Online Service Center" branding
- Default credentials stored in localStorage: `admin@clikmate.com` / `admin123` (hashed or plain for now)
- "Change Password" section in the Settings tab (current password + new password + confirm)
- Session stored in `localStorage` key `clikmate_admin_session`

### Modify
- `AdminDashboard` main component: remove ALL Internet Identity / ICP auth logic (`useInternetIdentity`, `identity`, `login`, `isLoggingIn`, `clear` references)
- Replace the two-step auth flow with a single email+password check
- Remove `AdminInitScreen` (master key screen) -- replaced by `AdminLoginScreen`
- Settings section: add "Change Admin Password" card below UPI settings
- Logout button: clear localStorage session key, return to login screen

### Remove
- `useInternetIdentity` import and all usages in `AdminDashboard.tsx`
- "Login with Internet Identity" button and the entire `if (!identity)` block
- `AdminInitScreen` component
- `clikmate_admin_auth` localStorage key (replaced by `clikmate_admin_session`)

## Implementation Plan
1. Remove `useInternetIdentity` hook usage and all ICP auth code from `AdminDashboard`
2. Add `adminCredentials` state initialized from localStorage (default: email=`admin@clikmate.com`, password=`admin123`)
3. Create `AdminLoginScreen` with email + password fields, "Smart Online Service Center" logo/branding, professional dark UI matching existing design language (navy/purple/yellow)
4. Add session check: `localStorage.getItem('clikmate_admin_session') === '1'` to auto-login
5. On successful login, set session in localStorage and show dashboard
6. Add "Change Admin Password" card to `SettingsSection`: current password verification, new password, confirm password
7. On password change, update stored credentials in localStorage
8. Logout clears `clikmate_admin_session` from localStorage
