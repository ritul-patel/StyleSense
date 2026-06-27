// Sentry client-side initialization for Next.js App Router.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || undefined,

  // Performance: 5% sampling for beta
  tracesSampleRate: 0.05,

  // Replay: 0% session sampling, 100% on error
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: true, // Don't record uploaded images
    }),
  ],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Privacy: do NOT send cookies, auth headers, or PII by default
  sendDefaultPii: false,

  // Filter sensitive data
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }
    // Scrub any password fields from breadcrumbs/extra
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((bc) => {
        if (bc.data && typeof bc.data === "object") {
          const d = bc.data as Record<string, unknown>;
          delete d["password"];
          delete d["token"];
          delete d["access_token"];
        }
        return bc;
      });
    }
    return event;
  },

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",
});
