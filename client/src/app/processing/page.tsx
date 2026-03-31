"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { styleService } from "../services/styleService";

function ProcessingPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  useEffect(() => {
    if (!id) return;

    const analysisId = id;

    async function fetchResult() {
      try {
        await styleService.getResult(analysisId);
        router.replace(`/result?id=${analysisId}`);
      } catch (error) {
        console.error(error);
      }
    }

    fetchResult();
  }, [id, router]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Analyzing your style...</h2>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", marginTop: "100px" }}>Loading...</div>}>
      <ProcessingPageContent />
    </Suspense>
  );
}
