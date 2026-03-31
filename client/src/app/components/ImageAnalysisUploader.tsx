"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ColorChip from "./ColorChip";
import Loader from "./Loader";
import ResultCard from "./ResultCard";
import styles from "./analysis-ui.module.css";
import { type AnalysisResult, styleService } from "../services/styleService";

type Status = "idle" | "loading" | "success" | "error";

export default function ImageAnalysisUploader() {
  const router = useRouter();
  const [skinTone, setSkinTone] = useState<"light" | "medium" | "dark">("medium");
  const [undertone, setUndertone] = useState<"warm" | "cool" | "neutral">("warm");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (status === "loading") {
      return;
    }

    try {
      setStatus("loading");
      setError(null);

      const analysis = await styleService.analyzeManual({
        skin_tone: skinTone,
        undertone,
      });

      setResult(analysis.result);
      sessionStorage.setItem("stylesense:lastResult", JSON.stringify(analysis.result));
      setStatus("success");
      router.push(`/result?id=${analysis.analysis_id}`);
    } catch (requestError: any) {
      setStatus("error");
      setError(requestError?.message || "We could not create that analysis.");
    }
  };

  return (
    <div className={`${styles.stackLg} ${styles.uploadFlow}`}>
      <ResultCard title="Manual Analysis">
        <div className={styles.stackMd}>
          <label className={styles.stackSm}>
            <span className={styles.previewName}>Skin Tone</span>
            <select
              className={styles.uploadBox}
              value={skinTone}
              onChange={(event) => setSkinTone(event.target.value as "light" | "medium" | "dark")}
              disabled={status === "loading"}
            >
              <option value="light">Light</option>
              <option value="medium">Medium</option>
              <option value="dark">Dark</option>
            </select>
          </label>

          <label className={styles.stackSm}>
            <span className={styles.previewName}>Undertone</span>
            <select
              className={styles.uploadBox}
              value={undertone}
              onChange={(event) => setUndertone(event.target.value as "warm" | "cool" | "neutral")}
              disabled={status === "loading"}
            >
              <option value="warm">Warm</option>
              <option value="cool">Cool</option>
              <option value="neutral">Neutral</option>
            </select>
          </label>
        </div>
      </ResultCard>

      <p className={styles.helperText}>Create an analysis record, generate a recommendation, store it in Supabase, and fetch it back.</p>

      {error ? (
        <div className={styles.errorCard}>
          <div className={styles.stackSm}>
            <div className={styles.errorTitle}>Analysis failed</div>
            <p className={styles.errorText}>{error}</p>
          </div>
        </div>
      ) : null}

      {status === "loading" ? (
        <div className={styles.card}>
          <Loader title="Saving your analysis..." text="StyleSense is creating the analysis, generating the recommendation, and storing the result in Supabase." />
        </div>
      ) : null}

      <button type="button" className={styles.primaryButton} onClick={handleAnalyze} disabled={status === "loading"}>
        <span className={styles.buttonRow}>
          {status === "loading" ? <span className={styles.spinner} aria-hidden="true" /> : null}
          <span>{status === "loading" ? "Saving..." : "Create Analysis"}</span>
        </span>
      </button>

      {result ? (
        <>
          <ResultCard title="Analysis Result">
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Skin Tone</div>
                <div className={styles.statValue}>{result.skin_tone}</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Undertone</div>
                <div className={styles.statValue}>{result.undertone}</div>
              </div>
            </div>
          </ResultCard>

          {result.best_colors.length > 0 ? (
            <ResultCard title="Best Colors">
              <div className={styles.chipsGrid}>
                {result.best_colors.map((color) => (
                  <ColorChip key={color} color={color} />
                ))}
              </div>
            </ResultCard>
          ) : null}

          {result.avoid_colors.length > 0 ? (
            <ResultCard title="Avoid Colors">
              <div className={styles.chipsGrid}>
                {result.avoid_colors.map((color) => (
                  <ColorChip key={`avoid-${color}`} color={color} variant="avoid" />
                ))}
              </div>
            </ResultCard>
          ) : null}

          {result.outfits.length > 0 ? (
            <ResultCard title="Outfits">
              <div className={styles.outfitList}>
                {result.outfits.map((outfit) => (
                  <div key={outfit} className={styles.outfitCard}>
                    <div className={styles.outfitDescription}>{outfit}</div>
                  </div>
                ))}
              </div>
            </ResultCard>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
