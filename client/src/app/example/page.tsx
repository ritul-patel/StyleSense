"use client";

import { useState } from "react";
import { runStyleSenseExample } from "@/services/styleService";

export default function ExamplePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [output, setOutput] = useState<string>("");

  async function handleRunExample() {
    try {
      setStatus("loading");

      const result = await runStyleSenseExample("medium", "warm");

      setOutput(JSON.stringify(result, null, 2));
      setStatus("success");
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Unknown error");
      setStatus("error");
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>StyleSense Example Usage</h1>
      <p>createAnalysis - getRecommendation - saveResult - getResult</p>

      <button
        type="button"
        onClick={handleRunExample}
        disabled={status === "loading"}
        style={{
          marginTop: 16,
          padding: "12px 18px",
          backgroundColor: "#111827",
          border: 0,
          borderRadius: 8,
          color: "#ffffff",
          cursor: status === "loading" ? "not-allowed" : "pointer",
        }}
      >
        {status === "loading" ? "Running..." : "Run Example"}
      </button>

      <pre
        style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 12,
          backgroundColor: "#f3f4f6",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
        }}
      >
        {output || "No output yet."}
      </pre>
    </main>
  );
}
