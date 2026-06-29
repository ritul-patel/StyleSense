# Troubleshooting

Common issues and their solutions for StyleSense development and deployment.

---

## Setup Issues

### `npm run dev` — server doesn't start

**Symptom:** Server exits immediately or shows a port error.

**Solutions:**
1. Check `server/.env` exists and all required variables are set (copy from `server/.env.example`)
2. Check if port 4000 is already in use:
   ```bash
   # Windows
   netstat -ano | findstr :4000
   # macOS/Linux
   lsof -i :4000
   ```
3. Change the port in `server/.env`: `PORT=4001`
4. The server runs `scripts/free-port.cjs` before starting (`predev` hook) — check if it's throwing an error

---

### Database migration fails

**Symptom:** `npm --prefix server run migrate up` throws a connection error.

**Solutions:**
1. Verify `DATABASE_URL` is set correctly in `server/.env`
2. For Supabase, use the **direct connection URL** (port 5432) — not the pooler (port 6543):
   ```
   # Correct (direct)
   DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
   
   # Wrong (pooler — will fail for migrations)
   DATABASE_URL=postgresql://postgres.xxx:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
   ```
3. Check that your Supabase project is not paused (free tier pauses after inactivity)

---

### Client can't reach the API — CORS error

**Symptom:** Browser console shows `Access-Control-Allow-Origin` error.

**Solutions:**
1. Confirm `NEXT_PUBLIC_API_URL` in `client/.env.local` is `http://localhost:4000/api/v1` (not `localhost:3000`)
2. Confirm the Express server is running (`npm run dev:server`)
3. The server's CORS allowlist in `server/src/index.ts` allows `localhost:3000` and `localhost:3001` in development. If you're running the client on a different port, add it to the allowlist temporarily

---

### `NEXT_PUBLIC_SUPABASE_URL` missing error in client

**Symptom:** The Next.js app throws a missing env variable error on startup.

**Solution:** Ensure `client/.env.local` exists with the correct values. Next.js does not pick up `.env` files in parent directories — the file must be in the `client/` directory.

---

## Gemini / AI Issues

### Gemini API call fails with `404 NOT_FOUND`

**Symptom:** `[gemini:req#N] Model "..." not found (404)`

**Solutions:**
1. Check `GEMINI_MODEL` in `server/.env` — use `gemini-2.5-flash` (not an older model ID)
2. Verify your `GEMINI_API_KEY` has access to the model in Google AI Studio
3. Check if the model name has changed in Google's API — Google periodically renames/retires models

---

### Gemini response parsing fails

**Symptom:** `[gemini:parse] ❌ ALL PARSE ATTEMPTS FAILED`

**Solutions:**
1. Check the raw response in the server log — the service logs the first 300 characters
2. The service retries once automatically — if both fail, the full response is logged
3. This may indicate the model is returning an error in natural language instead of JSON — check `finishReason` in the log (anything other than `STOP` indicates a problem)
4. Try reducing the prompt complexity or check for quota exhaustion (429)

---

### Gemini rate limited (429)

**Symptom:** `[gemini:req#N] Rate limited (429)`

**Solutions:**
1. Google AI Studio free tier has request-per-minute limits — wait and retry
2. For production, upgrade to a paid Google Cloud quota
3. The service does not automatically retry 429s — add delays between bulk import operations

---

## Image Pipeline Issues

### Image download fails

**Symptom:** `[imagePipeline] DOWNLOAD_FAILED`

**Solutions:**
1. Check if the source URL is accessible from the server (not blocked by CORS or auth)
2. The pipeline retries 3 times with exponential backoff — if all fail, the source server may be down or rate-limiting the bot
3. Check if the URL passes SSRF validation — private/internal URLs are blocked by design

---

### Supabase Storage upload fails

**Symptom:** `Upload failed: ...`

**Solutions:**
1. Verify the `product-images` bucket exists in your Supabase project
2. Check that the bucket is set to **public** read access
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct — the service role key is required for storage uploads
4. Check Supabase dashboard → Storage for quota limits

---

## Auth Issues

### JWT verification fails on API requests

**Symptom:** Server returns `401 UNAUTHORIZED` even with a valid Supabase session.

**Solutions:**
1. Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `server/.env` match your Supabase project
2. Ensure the client is sending the `Authorization: Bearer <token>` header — check `client/src/lib/api.ts`
3. Supabase JWTs expire — the Supabase JS client auto-refreshes them, but a stale client session may send an expired token. Try signing out and back in.

---

### Google OAuth redirect fails

**Symptom:** After Google sign-in, the user is redirected to an error page.

**Solutions:**
1. Check that your Supabase project has Google OAuth enabled (Supabase dashboard → Authentication → Providers → Google)
2. Verify the redirect URL (`/auth/callback` or your configured callback) is in the allowed list in both Google Cloud Console and Supabase
3. In development, ensure `http://localhost:3000/auth/callback` is in the allowed redirect URLs

---

## Performance Issues

### Next.js builds are slow

**Solutions:**
1. Turbopack is enabled for dev (`next dev`) — if you're seeing slow builds in dev, check for large module imports
2. For production builds (`next build`), Sentry adds overhead (source map generation). This is expected.
3. Run `npm --prefix client run build -- --profile` to see component render times

### API responses are slow

**Solutions:**
1. Check the database connection — slow queries are logged to the server console
2. Check if `DB_MAX_ATTEMPTS` and `DB_RETRY_DELAY_MS` are causing unnecessary retries on a flaky connection
3. The recommendation engine loads all products — add `limit` and `offset` query parameters to paginate results

---

## Getting More Help

If none of the above solutions work:

1. Check the [GitHub Issues](../../issues) for similar reports
2. Open a new issue using the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) template
3. Include your server console output, browser console errors, and environment (OS, Node.js version, browser)
