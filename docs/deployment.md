# Deployment Guide

This guide covers deploying the StyleSense frontend to **Vercel** and the backend to **Railway** or **Render**.

---

## Deploy Order

Always deploy in this sequence - each step depends on the one before it:

```
1. PostgreSQL (Supabase)   → provision + run migrations
2. Supabase Storage        → create product-images bucket
3. Backend (Railway/Render)→ deploy; verify GET /health → 200
4. Frontend (Vercel)       → set NEXT_PUBLIC_API_URL; deploy
```

---

## 1. Database Setup (Supabase)

### Create a Supabase Project

1. Sign in to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Service Role Key** from Project Settings → API

### Run Migrations

```bash
# Set DATABASE_URL to your Supabase direct connection string (port 5432)
export DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres

npm --prefix server run migrate up
```

### Create Storage Bucket

1. In your Supabase dashboard → Storage → New bucket
2. Name: `product-images`
3. Access: **Public** (product images need public read access)

---

## 2. Backend - Railway

### Deploy Steps

1. Create a new project at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Set the root directory to `server/`
4. Configure build and start commands:
   - **Build:** `npm install && npm run build`
   - **Start:** `node dist/index.js`

### Environment Variables

Set all variables from `server/.env.example` in Railway's Variables panel:

```
PORT=4000
DATABASE_URL=<your_supabase_direct_url>
SUPABASE_URL=<your_supabase_url>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
GEMINI_API_KEY=<your_gemini_key>
GEMINI_MODEL=gemini-2.5-flash
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_cloudinary_key>
CLOUDINARY_API_SECRET=<your_cloudinary_secret>
CLOUDINARY_FOLDER=stylesense
NODE_ENV=production
```

### Verify

After deployment, verify the server is healthy:
```bash
curl https://your-railway-url.railway.app/health
# → Server is healthy
```

---

## 2. Backend - Render (Alternative)

1. Create a new **Web Service** at [render.com](https://render.com)
2. Connect your GitHub repository
3. Set:
   - **Root directory:** `server`
   - **Build command:** `npm install && npm run build`
   - **Start command:** `node dist/index.js`
4. Add environment variables in the Render dashboard (same as Railway above)

---

## 3. Frontend - Vercel

### Deploy Steps

1. Import the project at [vercel.com/new](https://vercel.com/new)
2. Select your GitHub repository
3. Set the **Root Directory** to `client/`
4. Vercel auto-detects Next.js - no build command changes needed

### Environment Variables

Add these in Vercel → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

### Sentry (Production Only)

Sentry source maps are uploaded automatically during the Next.js production build if `SENTRY_AUTH_TOKEN` is set. Add it to Vercel environment variables:

```
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

### Custom Domain

In Vercel → Project → Domains, add `stylesense.co.in` and follow the DNS instructions.

After adding your domain, update the server's CORS allowlist - it is currently set to:
```typescript
const allowedOrigins = [
  "https://www.stylesense.co.in",
  "https://stylesense.co.in",
  "https://www.stylesens.in",
  "https://stylesens.in",
];
```

---

## 4. Post-Deployment Smoke Tests

Run these checks after every production deploy:

```bash
# 1. Health check
curl https://api.stylesense.co.in/health

# 2. Manual analysis (requires valid JWT - test via browser DevTools)
# POST /api/v1/analysis/manual
# Body: { "skin_tone": "medium", "undertone": "warm" }

# 3. Verify rate limiter
# Make 11 rapid requests to /api/v1/analysis - 11th should return 429
```

Also verify in the browser:
- [ ] Login / signup flows work
- [ ] Analysis flow completes (manual + photo upload)
- [ ] Results page displays recommendations
- [ ] Wardrobe save/load works
- [ ] No console errors in production

---

## Environment-Specific Behavior

| Setting | Development | Production |
|---|---|---|
| CORS | `localhost:3000`, `localhost:3001` | `stylesense.co.in` only |
| Sentry | Disabled | Enabled (wrapped in `withSentryConfig`) |
| Rate limit | Same (10/min analysis) | Same |
| Trust proxy | Enabled | Enabled (required for Railway/Render) |

---

## Rolling Back

### Frontend (Vercel)
Go to Vercel → Deployments → find the previous successful deployment → **Promote to Production**.

### Backend (Railway/Render)
Redeploy a previous Docker image or Git SHA from the platform's deployment history.

### Database
Rollback a migration:
```bash
npm --prefix server run migrate down
```

> ⚠️ **Caution:** Rolling back migrations that drop columns or tables is destructive. Always back up the database before running rollback in production.
