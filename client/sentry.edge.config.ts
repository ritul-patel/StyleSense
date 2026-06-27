// Sentry edge runtime initialization for Next.js App Router.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",
  release: process.env.VERCEL_GIT_COMMIT_SHA || undefined,

  // Performance: 5% sampling for beta
  tracesSampleRate: 0.05,

  // Privacy: do NOT send PII by default
  sendDefaultPii: false,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",
});
