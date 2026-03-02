

## Plan: Fix Unreliable LOGIN Audit Logging

### Root Cause
The LOGIN audit event in `Index.tsx` (line 63) is called as **fire-and-forget** — `logAuthEvent(...)` without `await`. It runs inside `onAuthStateChange`, which fires rapidly during OAuth redirects and token refreshes. If the component re-renders or navigates before the RPC completes, the event is silently lost.

Additionally, logging on both `SIGNED_IN` and `INITIAL_SESSION` events with a ref-based dedupe is fragile — the ref resets on every page mount, but the token-based key can miss legitimate logins or create false deduplication.

### Fix

**File: `src/pages/Index.tsx`**

1. **Move LOGIN logging out of `onAuthStateChange`** — instead, log the LOGIN event *after* the session is fully established and the component is stable
2. **Use `sessionStorage` for dedupe** instead of a ref (survives re-renders but resets on new browser sessions/tabs)
3. **Await the RPC** in a dedicated `useEffect` that fires once the session user ID is known and hasn't been logged yet this session
4. **Only log on `SIGNED_IN`**, not `INITIAL_SESSION` — `INITIAL_SESSION` is just "session already existed from storage," not a real login

The new approach:
- Remove login logging from the `onAuthStateChange` callback
- Add a separate `useEffect` that watches for a new session and logs LOGIN once per browser session using `sessionStorage.getItem("audit_login_logged_<userId>")`
- The `logAuthEvent` call is properly `await`ed
- Remove the `authLoggedRef`

**File: `src/lib/audit-helpers.ts`** — no changes needed, the function itself is fine.

### Summary
| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Move LOGIN audit to dedicated effect, use sessionStorage dedupe, await the RPC |

