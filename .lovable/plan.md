

## Problem

Two issues identified:

1. **Password reset redirect goes to wrong URL**: In `AuthForm.tsx`, the `resetPasswordForEmail` call uses `window.location.origin` for `redirectTo`. When triggered from the preview environment, this sends users to the Lovable preview URL instead of `https://erptable.lovable.app/reset-password`. The password reset email link therefore doesn't work correctly.

2. **Same problem exists everywhere `window.location.origin` is used for auth redirects**: The Google sign-in redirect also uses `window.location.origin`, which could cause issues in preview.

## Changes

### 1. Fix password reset redirect URL (`src/components/auth/AuthForm.tsx`)
- Replace `window.location.origin` in `resetPasswordForEmail` with a helper that returns `https://erptable.lovable.app` on production hostnames and `window.location.origin` otherwise
- This ensures the password reset email links to the published app, not the Lovable preview

### 2. Fix Google sign-in redirect URL (`src/components/auth/AuthForm.tsx`)
- Apply the same fix to the `handleGoogleSignIn` `redirect_uri` parameter

### Implementation detail
Add a small helper at the top of `AuthForm.tsx`:
```typescript
const getAppOrigin = () => {
  const host = window.location.hostname;
  if (host.includes("lovable.app") || host.includes("lovable.dev")) {
    return "https://erptable.lovable.app";
  }
  return window.location.origin;
};
```

Then use `getAppOrigin()` in place of `window.location.origin` for:
- Line 72: `redirectTo: \`${getAppOrigin()}/reset-password\``
- Line 57: `redirect_uri: getAppOrigin()`

