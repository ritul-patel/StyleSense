"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ColorChip from "../components/ColorChip";
import Loader from "../components/Loader";
import ResultCard from "../components/ResultCard";
import styles from "../components/analysis-ui.module.css";
import { AnalysisResult, normalizeAnalysisResult, styleService } from "../services/styleService";

function capitalize(value?: string) {
  if (!value) return "";
  return value
    .split(/[\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hasAnalysisData(result: AnalysisResult | null | undefined) {
  if (!result) return false;

  return Boolean(result.skin_tone || result.undertone || result.best_colors.length || result.avoid_colors.length || result.outfits.length);
}

function ResultPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("loading");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResult() {
      try {
        setStatus("loading");
        setError(null);

        const cached = sessionStorage.getItem("stylesense:lastResult");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const normalized = normalizeAnalysisResult(parsed?.data ?? parsed);

            sessionStorage.removeItem("stylesense:lastResult");

            if (hasAnalysisData(normalized)) {
              setResult(normalized);
              setStatus("success");
              return;
            }
          } catch {
            sessionStorage.removeItem("stylesense:lastResult");
          }
        }

        if (!id) {
          throw new Error("No analysis result was found.");
        }

        const data = await styleService.getResult(id);
        if (!hasAnalysisData(data)) {
          throw new Error("No analysis result was found.");
        }

        setResult(data);
        setStatus("success");
      } catch (loadError: any) {
        setStatus("error");
        setError(loadError.message || "We couldn't load your analysis.");
      }
    }

    loadResult();
  }, [id]);

  const summaryTitle = useMemo(() => {
    if (!result) return "";
    return `${capitalize(result.skin_tone)} ${capitalize(result.undertone)}`.trim();
  }, [result]);

  if (status === "loading") {
    return (
      <main className={styles.pageShell}>
        <div className={styles.pageContainer}>
          <Loader title="Loading your recommendation..." text="We are reading the saved result from Supabase." />
        </div>
      </main>
    );
  }

  if (status === "error" || !hasAnalysisData(result)) {
    return (
      <main className={styles.pageShell}>
        <div className={styles.pageContainer}>
          <ResultCard title="Something went wrong">
            <div className={styles.stackMd}>
              <p className={styles.errorText}>{error || "We couldn't load your result."}</p>
              <button type="button" className={styles.primaryButton} onClick={() => router.push("/upload")}>
                Try Again
              </button>
            </div>
          </ResultCard>
        </div>
      </main>
    );
  }

  const safeResult = result as AnalysisResult;

  return (
    <main className={styles.pageShell}>
      <div className={styles.pageContainer}>
        <header className={`${styles.pageHeader} ${styles.pageHeaderCentered}`}>
          <span className={styles.eyebrow}>StyleSense</span>
          <h1 className={styles.pageTitle}>Your Style Analysis</h1>
          <p className={styles.pageDescription}>Your saved recommendation from Supabase is ready.</p>
        </header>

        <div className={styles.stackLg}>
          <ResultCard className={styles.summaryCard}>
            <div className={styles.summaryText}>
              <h2 className={styles.summaryTitle}>{summaryTitle}</h2>
              <div className={styles.summarySeason}>Recommendation Ready</div>
              <p className={styles.summarySubtext}>Best colors, avoid colors, and outfit ideas are now stored in Supabase.</p>
            </div>
          </ResultCard>

          <ResultCard title="Skin Data">
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Skin Tone</div>
                <div className={styles.statValue}>{capitalize(safeResult.skin_tone) || "Unavailable"}</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>Undertone</div>
                <div className={styles.statValue}>{capitalize(safeResult.undertone) || "Unavailable"}</div>
              </div>
            </div>
          </ResultCard>

          <ResultCard title="Best Colors">
            {safeResult.best_colors.length > 0 ? (
              <div className={styles.chipsGrid}>
                {safeResult.best_colors.map((color) => (
                  <ColorChip key={`best-${color}`} color={color} variant="best" />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No best colors were returned for this analysis.</div>
            )}
          </ResultCard>

          <ResultCard title="Avoid Colors">
            {safeResult.avoid_colors.length > 0 ? (
              <div className={styles.chipsGrid}>
                {safeResult.avoid_colors.map((color) => (
                  <ColorChip key={`avoid-${color}`} color={color} variant="avoid" />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No avoid colors were returned for this analysis.</div>
            )}
          </ResultCard>

          <ResultCard title="Outfit Suggestions">
            {safeResult.outfits.length > 0 ? (
              <div className={styles.outfitList}>
                {safeResult.outfits.map((outfit, index) => (
                  <div key={`${outfit}-${index}`} className={styles.outfitCard}>
                    <div className={styles.outfitTitle}>Outfit {index + 1}</div>
                    <div className={styles.outfitDescription}>{outfit}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No outfit suggestions were returned for this analysis.</div>
            )}
          </ResultCard>

          <button type="button" className={styles.primaryButton} onClick={() => router.push("/upload")}>
            Create Another Analysis
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.pageShell}>
          <div className={styles.pageContainer}>
            <Loader title="Loading result..." text="Preparing your saved analysis." />
          </div>
        </main>
      }
    >
      <ResultPageContent />
    </Suspense>
  );
}
