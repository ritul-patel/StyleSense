# Environment Variables

This document describes every environment variable used in StyleSense.

---

## Client (`client/.env.local`)

Copy `client/.env.example` to `client/.env.local` to get started.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Express API base URL. Dev: `http://localhost:4000/api/v1`. Prod: your server URL. |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL. Found in Supabase dashboard → Project Settings → API. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | ✅ | Supabase anon/public key. Safe to expose client-side - RLS policies control access. |

> **Note:** All `NEXT_PUBLIC_*` variables are embedded in the browser bundle at build time. Never put secrets in these variables.

---

## Server (`server/.env`)

Copy `server/.env.example` to `server/.env` to get started.

### Server

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | - | `4000` | Port the Express server listens on. |
| `NODE_ENV` | - | `development` | Set to `production` to enable production CORS rules and Sentry. |

### Database

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string. Use the **direct connection** URL from Supabase (port 5432), not the pooler. |

### Supabase

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Supabase project URL. Same as `NEXT_PUBLIC_SUPABASE_URL` but used server-side. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key. Bypasses RLS. **Never expose client-side.** Found in Supabase dashboard → Project Settings → API → Service Role Key. |

### AI

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ | - | Google Gemini API key. Get from [Google AI Studio](https://aistudio.google.com). Required for AI metadata generation. |
| `GEMINI_MODEL` | - | `gemini-2.5-flash` | Gemini model to use for metadata generation. |
| `ANTHROPIC_API_KEY` | - | - | Anthropic Claude API key. Used for secondary AI integration. |

### Image Storage

| Variable | Required | Description |
|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | - | Cloudinary cloud name. Required if using the Cloudinary upload flow. |
| `CLOUDINARY_API_KEY` | - | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | - | Cloudinary API secret. |
| `CLOUDINARY_FOLDER` | - | Private Cloudinary namespace for analysis uploads (default: `stylesense_uploads`). |\n| `CLOUDINARY_UPLOAD_TIMEOUT_MS` | - | Cloudinary upload timeout in milliseconds (default: `30000`). |

### Runtime Tuning

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_MAX_ATTEMPTS` | - | `3` | Number of database query retry attempts before failing. |
| `DB_RETRY_DELAY_MS` | - | `400` | Delay between database retry attempts (milliseconds). |
| `PYTHON_TIMEOUT_MS` | - | `25000` | Timeout for Python skin-tone detection subprocess (milliseconds). |

---

## Sentry (`client/.env.sentry-build-plugin`)

Sentry build-time configuration. This file is generated automatically by the Sentry Next.js wizard and should **not** be committed (it's in `.gitignore`).

| Variable | Description |
|---|---|
| `SENTRY_ORG` | Your Sentry organization slug |
| `SENTRY_PROJECT` | Your Sentry project slug |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source map upload during builds |

---

## Security Rules

- **Never commit `.env` files** - only `.env.example` with placeholder values
- **Never put secrets in `NEXT_PUBLIC_*` variables** - they are embedded in the browser bundle
- **Rotate the Supabase service role key** if it is ever accidentally exposed
- **Use different Supabase projects** for development and production
