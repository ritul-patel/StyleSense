if (process.env.NODE_ENV === "production") {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: "https://b9488793f85eacfe2694ed523491b064@o4511618976382976.ingest.us.sentry.io/4511618979594240",
      tracesSampleRate: 1.0,
      debug: false,
    });
  });
}
