import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://b9488793f85eacfe2694ed523491b064@o4511618976382976.ingest.us.sentry.io/4511618979594240",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
