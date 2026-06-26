# StyleSense — Product Overview

## What It Is

StyleSense is an AI-powered personal styling and color analysis platform. Users upload a face photo and receive personalized insights: skin tone, undertone, seasonal color classification, recommended palettes, styling rules, materials, accessories, and outfit suggestions.

## Production Domain

https://www.stylesens.in

## Project Status

**Stage:** Launch Ready MVP

- User interface is complete — do not redesign unless explicitly requested.
- Current focus: backend reliability, AI accuracy, performance, security, bug fixes, testing.

---

## Core Features

Users upload a face image and receive:

- Skin Tone (Fitzpatrick I–VI)
- Undertone (warm / cool / neutral)
- Seasonal Color Analysis
- Personalized Color Palette (best colors + colors to avoid)
- Style Rules
- Recommended Materials
- Recommended Accessories
- Outfit Recommendations

Additional features:
- Analysis History (last 10 results)
- Static Outfit Discovery / Catalog
- Saved Outfits (browser localStorage)

---

## Application Flow

```
Authentication → Home → Upload Image → Loading Screen → Backend Analysis
→ AI Processing → Results Page → Save to History → History Page
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| Backend | Node.js, Express 5, TypeScript |
| AI Service | Python, OpenCV, NumPy (skin detection) |
| Recommendation | TypeScript engine (offline, deterministic palette lookup) |
| Database | PostgreSQL via Supabase |
| Authentication | Supabase Auth (email/password, Google OAuth) |
| Image Storage | Cloudinary |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Error Tracking | Sentry |
| Analytics | PostHog (partially wired) |

---

## Protected Pages

Authentication required for: `/analysis`, `/history`, `/wardrobe`, `/settings`, `/result`

---

## Development Constraints

- Do not redesign existing UI unless explicitly requested
- Maintain current user experience
- Keep changes minimal and isolated
- Avoid breaking existing functionality without approval
- Prioritize correctness, security, and reliability
