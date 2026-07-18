# Frontend Architecture

The StyleSense frontend is a **Next.js 16 App Router** application written in TypeScript. It follows a server-first rendering strategy where pages default to Server Components, with `"use client"` added only when browser APIs or interactivity are required.

---

## Folder Structure

```
client/src/
├── app/                    # Next.js App Router - all pages live here
│   ├── (auth)/             # Route group for unauthenticated pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── analysis/           # Core analysis flow (upload + manual)
│   ├── result/             # Recommendation results page
│   ├── wardrobe/           # Virtual wardrobe management
│   ├── outfit/             # Outfit builder
│   ├── discover/           # Product discovery + search
│   ├── history/            # Past analysis history
│   ├── admin/              # Admin panel (product import, metadata QA)
│   ├── settings/           # User account settings
│   ├── about/, contact/, privacy/, terms/
│   ├── api/                # Next.js Route Handlers (edge functions)
│   ├── context/            # App-level context providers
│   ├── providers/          # Third-party provider wrappers (analytics, etc.)
│   ├── layout.tsx          # Root layout with fonts, analytics, Sentry
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Global CSS + Tailwind base styles
│   ├── robots.ts           # Robots.txt generator
│   └── sitemap.ts          # Sitemap generator
│
├── components/
│   ├── ui/                 # Base design system components (buttons, cards, inputs)
│   ├── icons/              # SVG icon components
│   └── motion/             # Framer Motion wrapper components
│
├── lib/
│   ├── api.ts              # Typed API client (fetch wrapper with auth)
│   ├── supabase.ts         # Supabase browser client (singleton)
│   ├── auth-context.tsx    # AuthContext - session + user state
│   ├── theme-context.tsx   # ThemeContext - light/dark mode
│   ├── motion.ts           # Shared Framer Motion animation variants
│   ├── lenis.tsx           # Lenis smooth scroll provider
│   ├── outfit-recommendation.ts  # Client-side outfit logic
│   ├── products-api.ts     # Product catalog API helpers
│   ├── profile-cache.ts    # In-memory profile cache
│   ├── wardrobe-repository.ts    # Wardrobe data access
│   └── api-wardrobe-repository.ts
│
├── data/                   # Static JSON data (color profiles, palettes)
├── types/                  # Shared TypeScript interfaces
└── utils/                  # Pure helper functions
```

---

## Routing

StyleSense uses the **Next.js App Router** with file-based routing. Key conventions:

| File | Purpose |
|---|---|
| `page.tsx` | The route's UI - renders as a Server Component by default |
| `layout.tsx` | Shared layout wrapping all child routes |
| `loading.tsx` | Suspense boundary UI shown during async data loading |
| `error.tsx` | Error boundary UI for route-level errors |
| `not-found.tsx` | Custom 404 page |

The `(auth)` folder is a **route group** - it doesn't appear in the URL but allows shared layout for unauthenticated pages.

---

## Rendering Strategy

| Page | Strategy | Reason |
|---|---|---|
| Landing page | Static (SSG) | No dynamic data |
| Analysis | Client Component | File upload + interactive form |
| Results | Server Component + Client hydration | SEO + personalized data |
| Wardrobe | Client Component | Requires user session |
| Admin | Client Component | Requires auth + interactive tools |
| About / Privacy / Terms | Static (SSG) | No dynamic data |

---

## State Management

StyleSense uses **local component state** via `useState` and `useReducer` - no global state library. Cross-component state is handled via React Context:

| Context | File | Purpose |
|---|---|---|
| `AuthContext` | `lib/auth-context.tsx` | Current user session + sign in/out actions |
| `ThemeContext` | `lib/theme-context.tsx` | Light/dark mode preference |

### Async State Pattern

Every component that calls the API follows this pattern:

```typescript
type AsyncState = 'idle' | 'loading' | 'success' | 'error';

const [status, setStatus] = useState<AsyncState>('idle');
const [error, setError]   = useState<string | null>(null);

async function handleSubmit() {
  setStatus('loading');
  setError(null);
  try {
    const result = await api.post('/analysis/manual', input);
    setStatus('success');
    router.push(`/result/${result.analysis_id}`);
  } catch (err: any) {
    setStatus('error');
    setError(err.message ?? 'Something went wrong.');
  }
}
```

Rules:
- Submit buttons are `disabled` while `status === 'loading'`
- Errors are always shown to the user - never swallowed silently
- Loading state is set immediately on submit - before the network call starts

---

## API Client

All network calls go through `lib/api.ts` - a typed fetch wrapper that:

- Sets `Authorization: Bearer <token>` on every request using the Supabase session
- Normalizes error responses to a consistent `{ code, message, field? }` shape
- Throws typed errors that components can display directly

Never use raw `fetch()` in page or component files - always go through the API client.

---

## Animation

Framer Motion is used for:
- **Page transitions** - fade/slide in on route change
- **Component animations** - staggered list reveals, hover effects
- **Micro-interactions** - button feedback, card hover states

Animation variants are defined centrally in `lib/motion.ts` so they're consistent across the app.

---

## Smooth Scroll

**Lenis** provides native-feeling smooth scroll. It's initialized once in `lib/lenis.tsx` and wrapped around the app layout. Lenis integrates with Framer Motion's scroll progress tracking.

---

## Performance

- `next/image` is used for all images - automatic WebP/AVIF conversion, lazy loading, and size optimization
- Heavy dependencies (`framer-motion`, `lucide-react`, `posthog-js`) are tree-shaken via `optimizePackageImports`
- Static assets have 1-year immutable cache headers (configured in `next.config.ts`)
- The app disables Node.js gzip compression (`compress: false`) - Vercel's CDN handles compression at the edge

---

## Error Monitoring

**Sentry** is configured in three files:
- `sentry.client.config.ts` - browser error tracking
- `sentry.server.config.ts` - server-side error tracking
- `sentry.edge.config.ts` - edge runtime error tracking

In production builds, Sentry source maps are uploaded and hidden from the browser. A tunnel route (`/monitoring`) bypasses ad blockers.

---

## Analytics

- **PostHog** - product analytics (initialized in the providers wrapper)
- **Vercel Analytics** - page view tracking
- **Vercel Speed Insights** - Core Web Vitals reporting
