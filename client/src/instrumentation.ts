import * as Sentry from "@sentry/nextjs";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: "https://b9488793f85eacfe2694ed523491b064@o4511618976382976.ingest.us.sentry.io/4511618979594240",
      tracesSampleRate: 1.0,
      debug: false,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: "https://b9488793f85eacfe2694ed523491b064@o4511618976382976.ingest.us.sentry.io/4511618979594240",
      tracesSampleRate: 1.0,
      debug: false,
    });
  }
}
