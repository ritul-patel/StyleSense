// Sentry server-side initialization for Next.js App Router.
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

  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }
    return event;
  },

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",
});
