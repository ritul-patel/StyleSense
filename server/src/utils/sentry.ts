/**
 * Sentry initialization for the Express backend.
 * Must be imported BEFORE any other modules in index.ts.
 * Loads dotenv first since this runs before the main dotenv.config() call.
 */

import dotenv from "dotenv";
dotenv.config();

import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "";
const isProduction = process.env.NODE_ENV === "production";

if (dsn && isProduction) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || "production",
    release: process.env.SENTRY_RELEASE || undefined,

    // Performance: 5% sampling for beta
    tracesSampleRate: 0.05,

    // Privacy: do NOT send cookies/auth headers
    sendDefaultPii: false,

    beforeSend(event) {
      // Strip authorization headers from request context
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
        delete event.request.headers["x-supabase-auth"];
      }
      // Strip any secret env vars that might leak into breadcrumbs
      if (event.extra) {
        delete event.extra["DATABASE_URL"];
        delete event.extra["SUPABASE_SERVICE_ROLE_KEY"];
        delete event.extra["ANTHROPIC_API_KEY"];
      }
      return event;
    },

    // Ignore expected errors
    ignoreErrors: [
      "ECONNRESET",
      "EPIPE",
      "ERR_STREAM_PREMATURE_CLOSE",
    ],
  });

  console.log("[sentry] Initialized for production");
} else if (!dsn) {
  console.log("[sentry] Skipped — no SENTRY_DSN configured");
} else {
  console.log("[sentry] Skipped — not production");
}

export { Sentry };
export const isSentryEnabled = !!(dsn && isProduction);
