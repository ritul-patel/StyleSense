# Authentication

StyleSense uses **Supabase Auth** for identity management across both client and server.

---

## Auth Methods

| Method | Status |
|---|---|
| Email + Password | ✅ Enabled |
| Google OAuth | ✅ Enabled |
| Magic Link (email) | 🔜 Planned |

---

## Client-Side Auth

### Supabase Client

The Supabase browser client is initialized as a singleton in `client/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);
```

### AuthContext

`client/src/lib/auth-context.tsx` provides a React Context that wraps the entire app and exposes:

- `user` — the current authenticated user (or `null` if unauthenticated)
- `session` — the current Supabase session (includes the access token)
- `signIn(email, password)` — email/password login
- `signUp(email, password)` — registration
- `signInWithGoogle()` — Google OAuth redirect
- `signOut()` — log out and clear session
- `loading` — `true` while the initial session check is in progress

The context subscribes to `supabase.auth.onAuthStateChange()` to keep state in sync with Supabase's internal session management.

### Protecting Routes

Client-side route protection is handled in individual page components:

```typescript
const { user, loading } = useAuth();

if (loading) return <LoadingSpinner />;
if (!user) { router.push('/login'); return null; }
```

For layout-level protection, the `(auth)` route group layout handles the redirect.

---

## Server-Side Auth

### JWT Verification

Every protected API endpoint validates the Supabase JWT in `server/src/middleware/auth.ts`:

1. Reads `Authorization: Bearer <token>` from the request header
2. Calls `supabase.auth.getUser(token)` using the **service role key** (not the anon key)
3. Attaches `req.user` to the request for use in route handlers
4. Returns `401 UNAUTHORIZED` if the token is missing, malformed, or expired

```typescript
// auth middleware (simplified)
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) {
  return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token.' } });
}
req.user = user;
next();
```

### Admin Auth

`server/src/middleware/adminAuth.ts` applies additional verification on top of the standard auth middleware:

- Checks that the authenticated user has admin privileges (stored in user metadata or a separate `admins` table)
- Returns `403 FORBIDDEN` for non-admin users on admin routes

---

## Auth Flow — Email/Password

```
1. User fills signup form (email + password)
2. supabase.auth.signUp() → Supabase sends verification email
3. User clicks email link → Supabase verifies email + creates session
4. onAuthStateChange fires → AuthContext updates user/session state
5. User is redirected to /analysis
```

---

## Auth Flow — Google OAuth

```
1. User clicks "Continue with Google"
2. supabase.auth.signInWithOAuth({ provider: 'google' }) → redirect to Google
3. Google authenticates → redirects back to /auth/callback
4. Supabase exchanges the OAuth code for a session
5. onAuthStateChange fires → AuthContext updates state
6. User is redirected to /analysis
```

---

## Password Reset Flow

```
1. User enters email on /forgot-password
2. supabase.auth.resetPasswordForEmail(email) → Supabase sends reset email
3. User clicks link → redirected to /reset-password with a token in the URL
4. User enters new password
5. supabase.auth.updateUser({ password }) → password updated
6. User is redirected to /login
```

Custom Supabase email templates for verification and reset are in `client/supabase-email-templates/`.

---

## Environment Variables

| Variable | Location | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `client/.env.local` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `client/.env.local` | Supabase anon key (public) |
| `SUPABASE_URL` | `server/.env` | Supabase project URL (server) |
| `SUPABASE_SERVICE_ROLE_KEY` | `server/.env` | Service role key — **never expose client-side** |

---

## Security Notes

- The **service role key** is only used server-side and bypasses Row Level Security. It must never be exposed to the client.
- The **anon key** is safe to expose client-side — it only has permissions defined by Supabase's Row Level Security policies.
- JWTs expire according to Supabase's configured session duration. The Supabase JS client handles automatic token refresh.
- All API calls from the client include the JWT — the server re-validates it on every request; the client is never trusted implicitly.
