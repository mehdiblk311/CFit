# Backend ↔ Frontend Flow Compatibility Issues & Fixes

**Date:** 2026-04-13  
**Status:** RESOLVED — All flows now compatible

---

## Issue 1: Login/Register Response Structure

### Backend Reality
- **Endpoint:** `POST /v1/auth/login` and `POST /v1/auth/register`
- **Response Status:** 202 ACCEPTED (if 2FA required) or 200 OK (if success)
- **Response Body:** `authSessionResponse` with:
  - `access_token` (JWT, short-lived ~24h)
  - `refresh_token` (long-lived session token)
  - `expires_in` (seconds until access token expires)
  - `user` (User object)
  - **IF 2FA REQUIRED:** `two_factor_required: true`, `two_factor_token: <string>`

### Frontend Expected (from design)
- Simple `login(email, password)` → returns tokens and user
- Separate 2FA challenge flow triggered by `two_factor_required: true` flag

### Fix Applied ✅
- **API modules updated:** `src/api/auth.js` now handles both response structures
- **Login response handler:** Checks for `two_factor_required` flag
- **useAuth hook:** Returns both access and refresh tokens correctly
- **New flow:** Login → check 2FA flag → route to 2FA challenge if needed

---

## Issue 2: Refresh Token Flow

### Backend Reality
- **Endpoint:** `POST /v1/auth/refresh`
- **Request body:** `{ "refresh_token": "<token>" }`
- **Response:** 200 OK with new access + refresh tokens
  ```json
  {
    "access_token": "<new JWT>",
    "refresh_token": "<new refresh token>",
    "expires_in": 86400
  }
  ```

### Frontend Expected
- Axios interceptor catches 401 responses
- Makes refresh call with refresh_token from store
- Retries original request with new access_token

### Fix Applied ✅
- **client.js interceptor:** Already implemented correctly
- **authStore:** Persists both tokens properly (access_token in memory, refresh_token in localStorage)
- **No changes needed:** This flow was already correct in Section 1

---

## Issue 3: 2FA Challenge Flow

### Backend Reality
- **Step 1 (Login):** Call `POST /v1/auth/login` with email + password
  - If 2FA required: Returns 202 ACCEPTED with `two_factor_token` + `two_factor_required: true`
  - User is NOT authenticated at this stage
  
- **Step 2 (Challenge):** Call `POST /v1/auth/login` AGAIN with:
  - Same email + password (unchanged, or omit if using twoFactorToken)
  - `two_factor_token: <token from step 1>`
  - `totp_code: <6-digit code>` OR `recovery_code: <recovery code>`
  - Returns 200 OK with full auth session if successful
  - Returns 202 ACCEPTED if recovery code used and more recovery codes available

### Frontend Expected
- Show login form → collect credentials
- If 2FA required, show 2FA input screen
- User enters TOTP or recovery code
- Submit and get tokens

### Fix Applied ✅
- **New component:** `TwoFactorChallenge.jsx` created
- **Flow in AppRouter:** Login → check 2FA flag → route to `/2fa-challenge`
- **useAuth.js:** Added `initiate2FA()` method to store challenge token temporarily
- **authStore:** Persists `two_factor_token` during challenge phase (clears on success/logout)

---

## Issue 4: 2FA Setup Flow

### Backend Reality
- **Setup endpoint:** `POST /v1/auth/2fa/setup` (protected, requires JWT)
  - Returns QR code (as text/image data)
  - Returns secret key
  - Requires verification before enabling
  
- **Verify setup:** `POST /v1/auth/2fa/verify` (protected)
  - Body: `{ "code": "<6-digit TOTP>" }`
  - Returns `recovery_codes: [<codes>]` if successful
  - Returns `verified: true`

### Frontend Expected
- Settings page has "Enable 2FA" button
- Shows QR code for user to scan
- Input field for verification code
- Displays recovery codes on success

### Fix Applied ✅
- **Updated Settings.jsx:** Added 2FA setup section
- **New flow:** Setup button → show QR → input code → save recovery codes
- **useAuth.js:** Added `setup2FA()` and `confirm2FA()` methods

---

## Issue 5: Logout Flow

### Backend Reality
- **Endpoint:** `POST /v1/auth/logout` (protected, requires JWT)
- **Request body:** Either:
  - `{ "all_sessions": true }` — logout all sessions
  - `{ "refresh_token": "<token>" }` — logout only this session
- **Response:** 204 No Content

### Frontend Expected
- Logout button clears auth state and tokens
- Redirects to login

### Fix Applied ✅
- **useAuth.js:** Logout method calls API with `all_sessions: true`
- **authStore:** Clears all tokens and user after logout
- **Automatic cleanup:** Clears all localStorage keys

---

## Issue 6: Onboarding Flow

### Backend Reality
- **Profile update:** `PATCH /v1/users/{id}` accepts:
  - `weight`, `height`, `age`, `date_of_birth`
  - `goal`, `activity_level`
  - `tdee` (calculated if not provided)
  
- **Nutrition targets:** `GET /v1/users/{id}/nutrition-targets`
  - Returns calculated TDEE and macro/micro targets
  - Read-only (calculated from profile)

- **No "complete onboarding" endpoint** — onboarding is complete when profile has weight + height + goal

### Frontend Expected
- Step 1: Basic info (DOB, weight, height)
- Step 2: Goal + activity level
- Step 3: Show targets (read-only)
- Step 4: Complete (redirect to dashboard)

### Fix Applied ✅
- **useAuth.js:** Added `updateProfile()` method
- **OnboardingFlow.jsx:** Wired all 3 steps to API calls
- **Computed guard:** `isOnboarded()` checks if user has weight + height + goal (no backend flag needed)

---

## Issue 7: Forgot Password

### Backend Reality
- **NO ENDPOINT EXISTS** — backend has no password reset flow
- This is explicitly documented as "not yet built"

### Frontend Expected (from old design)
- Forgot password link on login
- Password reset flow

### Fix Applied ✅
- **Removed:** All ForgotPassword*.jsx components deleted
- **Login.jsx:** Removed "Forgot password?" link
- **No 2FA recovery endpoint:** Using recovery codes from 2FA setup instead

---

## Summary of Changes

| Component | Issue | Fix | Status |
|-----------|-------|-----|--------|
| Login/Register | Response structure mismatch | Check 2FA flag, route accordingly | ✅ |
| Refresh | Token structure | Already correct in Section 1 | ✅ |
| 2FA Challenge | Separate step required | New TwoFactorChallenge.jsx component | ✅ |
| 2FA Setup | API flow mismatch | Updated useAuth, Settings.jsx | ✅ |
| Logout | Session revocation | Call with all_sessions flag | ✅ |
| Onboarding | No complete endpoint | Use computed isOnboarded() guard | ✅ |
| Forgot Password | No backend endpoint | Deleted all components | ✅ |

---

## Authentication Flow Diagram

```
User → Login Form (email, password)
  ↓
POST /v1/auth/login
  ↓
  ├─ No 2FA: 200 OK → {access_token, refresh_token, user}
  │         ↓
  │         authStore.login() → redirect to /dashboard
  │
  └─ 2FA Required: 202 ACCEPTED → {two_factor_required, two_factor_token, user}
           ↓
           Navigate to /2fa-challenge
           ↓
           User enters TOTP/recovery code
           ↓
           POST /v1/auth/login (again, with two_factor_token + code)
           ↓
           200 OK → {access_token, refresh_token, user}
           ↓
           authStore.login() → redirect to /dashboard
```

---

## Files Modified/Created

- **src/api/auth.js** — Login/register now handle both responses
- **src/stores/authStore.js** — Added two_factor_token field for challenge phase
- **src/hooks/useAuth.js** — Added 2FA-specific methods
- **src/components/auth/TwoFactorChallenge.jsx** — NEW
- **src/components/auth/Login.jsx** — Removed forgot password link
- **src/components/auth/ForgotPassword*.jsx** — DELETED (5 files)
- **src/components/user/Settings/Settings.jsx** — Added 2FA setup section
- **src/router/guards.jsx** — No changes (useAuth replacement handles it)
