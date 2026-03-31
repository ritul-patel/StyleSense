"use client";

import ImageAnalysisUploader from "../components/ImageAnalysisUploader";
import styles from "../components/analysis-ui.module.css";

export default function UploadPage() {
  return (
    <main className={styles.pageShell}>
      <div className={`${styles.pageContainer} ${styles.pageContainerCentered}`}>
        <header className={`${styles.pageHeader} ${styles.pageHeaderCentered}`}>
          <span className={styles.eyebrow}>StyleSense</span>
          <h1 className={styles.pageTitle}>Create your analysis</h1>
          <p className={styles.pageDescription}>
            Pick a skin tone and undertone, save the analysis to Supabase, and load the stored recommendation instantly.
          </p>
        </header>

        <ImageAnalysisUploader />
      </div>
    </main>
  );
}
