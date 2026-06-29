"use client";

import { useEffect, useState } from "react";

/**
 * Lazy wrapper for FeedbackWidget.
 * 
 * Defers loading until after hydration + idle time.
 * This keeps framer-motion out of the critical rendering path
 * since the widget isn't needed until user wants to give feedback.
 */
export default function LazyFeedbackWidget() {
  const [Widget, setWidget] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Load after the browser is idle — never block initial render
    const load = () => {
      import("./FeedbackWidget").then((mod) => {
        setWidget(() => mod.default);
      });
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(load, { timeout: 4000 });
    } else {
      setTimeout(load, 2000);
    }
  }, []);

  if (!Widget) return null;
  return <Widget />;
}
