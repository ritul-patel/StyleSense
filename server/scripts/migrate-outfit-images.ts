/**
 * One-Time Migration Script: Outfit Cover Images → Supabase Storage
 *
 * Downloads outfit images from Pinterest, processes them through the
 * existing image pipeline (resize, WebP, upload), and rewrites
 * client/src/data/outfits.ts with the new Supabase Storage URLs.
 *
 * Usage:
 *   cd server
 *   npm run migrate:outfits
 *
 * Or directly:
 *   npx ts-node --skip-project scripts/migrate-outfit-images.ts
 */

import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load env FIRST — before any imports that need env vars
const envPath = path.resolve(__dirname, "../.env");
console.log(`[env] Loading: ${envPath}`);
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.error(`[env] ERROR loading .env: ${envResult.error.message}`);
  console.error(`[env] Make sure server/.env exists with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY`);
  process.exit(1);
}
console.log(`[env] Loaded. SUPABASE_URL=${process.env.SUPABASE_URL ? "SET" : "MISSING"}`);

import { importImage, resolvePublicUrl } from "../src/services/imagePipeline";

// ─── Configuration ──────────────────────────────────────────────────────────

const OUTFITS_FILE = path.resolve(__dirname, "../../client/src/data/outfits.ts");
const DELAY_BETWEEN_MS = 1000;

// ─── Types ──────────────────────────────────────────────────────────────────

interface Outfit {
  outfit_id: string;
  imageUrl: string;
  pinterestUrl: string;
}

// ─── Parse outfits.ts ───────────────────────────────────────────────────────

function parseOutfitsFile(filePath: string): Outfit[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  console.log(`[parse] File size: ${content.length} bytes`);

  const outfits: Outfit[] = [];

  // Match each outfit object — handles multiline with any whitespace
  const objectRegex = /outfit_id:\s*"([^"]+)"[\s\S]*?imageUrl:\s*"([^"]+)"[\s\S]*?pinterestUrl:\s*"([^"]+)"/g;
  let match;

  while ((match = objectRegex.exec(content)) !== null) {
    outfits.push({
      outfit_id: match[1],
      imageUrl: match[2],
      pinterestUrl: match[3],
    });
  }

  console.log(`[parse] Parsed ${outfits.length} outfits from file`);

  if (outfits.length === 0) {
    throw new Error("Failed to parse any outfits from file. Check regex against file format.");
  }

  return outfits;
}

// ─── Write updated outfits.ts ───────────────────────────────────────────────

function writeOutfitsFile(filePath: string, outfits: Outfit[]): void {
  const entries = outfits.map((o) => {
    return `  {\n    outfit_id: "${o.outfit_id}",\n    imageUrl: "${o.imageUrl}",\n    pinterestUrl: "${o.pinterestUrl}"\n  }`;
  });

  const content = `export type Outfit = {
  outfit_id: string;
  imageUrl: string;
  pinterestUrl: string;
};

export const OUTFITS: Outfit[] = [
${entries.join(",\n")}
];
`;

  console.log(`[write] Writing ${content.length} bytes to: ${filePath}`);
  fs.writeFileSync(filePath, content, "utf-8");

  // Verify the write succeeded
  const verification = fs.readFileSync(filePath, "utf-8");
  if (verification.length !== content.length) {
    throw new Error(`Write verification failed! Expected ${content.length} bytes, got ${verification.length}`);
  }
  console.log(`[write] ✅ Verified — file written successfully`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  StyleSense — Outfit Image Migration");
  console.log("═══════════════════════════════════════════════════════════\n");

  // 1. Verify paths
  console.log(`[config] Outfits file: ${OUTFITS_FILE}`);
  console.log(`[config] File exists: ${fs.existsSync(OUTFITS_FILE)}`);
  console.log("");

  // 2. Load outfits
  const outfits = parseOutfitsFile(OUTFITS_FILE);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  const errors: Array<{ outfit_id: string; url: string; error: string }> = [];

  // 3. Process each outfit
  for (let i = 0; i < outfits.length; i++) {
    const outfit = outfits[i];
    const label = `[${i + 1}/${outfits.length}] ${outfit.outfit_id}`;

    // Skip if already migrated
    if (outfit.imageUrl.includes("supabase.co/storage")) {
      console.log(`  ${label} — SKIP (already Supabase URL)`);
      skipped++;
      continue;
    }

    console.log(`  ${label} — downloading: ${outfit.imageUrl.substring(0, 60)}...`);

    try {
      const result = await importImage({
        sourceUrl: outfit.imageUrl,
        category: "outfits",
        slug: outfit.outfit_id.toLowerCase(),
      });

      if (result.success && result.storagePath) {
        const oldUrl = outfit.imageUrl;
        const newUrl = resolvePublicUrl(result.storagePath);
        outfit.imageUrl = newUrl;
        uploaded++;
        const sizeKB = Math.round((result.sizeBytes || 0) / 1024);
        console.log(`  ${label} — ✅ SUCCESS (${sizeKB}KB WebP)${result.wasDuplicate ? " [reused]" : ""}`);
        console.log(`           OLD: ${oldUrl.substring(0, 50)}...`);
        console.log(`           NEW: ${newUrl.substring(0, 50)}...`);
      } else {
        failed++;
        const errMsg = result.error || "Pipeline returned success:false with no error";
        errors.push({ outfit_id: outfit.outfit_id, url: outfit.imageUrl, error: errMsg });
        console.log(`  ${label} — ❌ FAILED: ${errMsg}`);
      }
    } catch (err: any) {
      failed++;
      const errMsg = err.message || String(err);
      errors.push({ outfit_id: outfit.outfit_id, url: outfit.imageUrl, error: errMsg });
      console.log(`  ${label} — ❌ EXCEPTION: ${errMsg}`);
    }

    // Throttle
    if (i < outfits.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_MS));
    }
  }

  // 4. ALWAYS write the file if ANY changes were made (even partial)
  console.log("\n─────────────────────────────────────────────────────────");
  const hasChanges = uploaded > 0;

  if (hasChanges) {
    writeOutfitsFile(OUTFITS_FILE, outfits);
  } else if (skipped === outfits.length) {
    console.log("[write] All outfits already migrated. No write needed.");
  } else {
    console.log("[write] ⚠️  No successful uploads — file NOT modified.");
    console.log("[write] Check errors above. Common causes:");
    console.log("[write]   - SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    console.log("[write]   - Supabase Storage bucket 'product-images' doesn't exist");
    console.log("[write]   - Pinterest blocking downloads (try again later)");
    console.log("[write]   - Network connectivity issues");
  }

  // 5. Summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  MIGRATION SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Total outfits: ${outfits.length}`);
  console.log(`  Uploaded:      ${uploaded}`);
  console.log(`  Skipped:       ${skipped} (already Supabase)`);
  console.log(`  Failed:        ${failed}`);
  console.log(`  File written:  ${hasChanges ? "YES ✅" : "NO"}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  if (errors.length > 0) {
    console.log("FAILED ITEMS:");
    for (const err of errors) {
      console.log(`  ${err.outfit_id}: ${err.error}`);
      console.log(`    Source: ${err.url}`);
    }
    console.log("");
  }

  if (failed > 0 && uploaded > 0) {
    console.log("⚠️  Partial success. Re-run to retry failed items.\n");
    process.exit(1);
  } else if (failed > 0 && uploaded === 0) {
    console.log("❌ All items failed. Check configuration and try again.\n");
    process.exit(1);
  }

  console.log("✅ Migration complete. Rebuild the client to apply changes.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ FATAL ERROR:", err.message || err);
  console.error(err.stack || "");
  process.exit(1);
});
