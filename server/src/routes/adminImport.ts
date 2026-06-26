import { Router, type Request, type Response } from "express";
import * as db from "../utils/db";
import { adminMiddleware } from "../middleware/adminAuth";
import type { AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// ─── CSV Templates (PUBLIC — no auth required) ────────────────────────────────

const PRODUCT_TEMPLATE_COLS = "name,brand,category,price,currency,image_url,affiliate_url,primary_color,secondary_colors,season,style,occasion,material,fit,formality,gender,description";
const OUTFIT_TEMPLATE_COLS = "outfit_name,occasion,season,style,top_product_slug,bottom_product_slug,shoes_product_slug,layer_product_slug,accessories,image_url";

// GET /api/v1/admin/import/products/template
router.get("/products/template", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=products_template.csv");
  res.send(PRODUCT_TEMPLATE_COLS + "\nExample Product,BrandName,tshirt,999,INR,https://example.com/img.jpg,,Black,\"[\"\"white\"\"]\",[\"\"summer\"\"],casual,daily,cotton,regular,casual,men,A great product\n");
});

// GET /api/v1/admin/import/outfits/template
router.get("/outfits/template", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=outfits_template.csv");
  res.send(OUTFIT_TEMPLATE_COLS + "\nWeekend Casual,casual,summer,minimal,beige-oversized-tshirt,blue-slim-jeans,white-sneakers,,\"\",https://example.com/outfit.jpg\n");
});

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = (values[idx] || "").trim(); });
    rows.push(row);
  }

  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function makeSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

function tryParseJSON(val: string): any {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return val.split(",").map((s) => s.trim()).filter(Boolean); }
}

// ─── Product Import ───────────────────────────────────────────────────────────

type ImportResult = {
  imported: number;
  skipped: number;
  failed: number;
  duplicates: number;
  errors: { row: number; field: string; message: string }[];
};

// POST /api/v1/admin/import/products (PROTECTED — admin only)
router.post("/products", adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { csv } = req.body;
    if (!csv || typeof csv !== "string") {
      return res.status(400).json({ success: false, message: "csv field (string) is required." });
    }

    const { headers, rows } = parseCSV(csv);
    if (!headers.includes("name") || !headers.includes("category")) {
      return res.status(400).json({ success: false, message: "CSV must have 'name' and 'category' columns." });
    }

    const result: ImportResult = { imported: 0, skipped: 0, failed: 0, duplicates: 0, errors: [] };
    const BATCH = 100;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const rowNum = i + j + 2; // 1-indexed, skip header

        // Validate required fields
        if (!row.name?.trim()) {
          result.errors.push({ row: rowNum, field: "name", message: "Name is required" });
          result.failed++;
          continue;
        }
        if (!row.category?.trim()) {
          result.errors.push({ row: rowNum, field: "category", message: "Category is required" });
          result.failed++;
          continue;
        }

        const slug = makeSlug(row.name);
        const price = Number(row.price) || 0;

        try {
          const q = await db.query(
            `INSERT INTO products (name, slug, brand, category, price, currency, image_url, affiliate_url, store_url, primary_color, secondary_colors, seasons, styles, occasions, materials, fit, formality, description, is_published)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18, false)
             ON CONFLICT (slug) DO NOTHING
             RETURNING id`,
            [
              row.name.trim(),
              slug,
              (row.brand || "").trim(),
              row.category.trim(),
              price,
              (row.currency || "INR").trim(),
              (row.image_url || "").trim(),
              (row.affiliate_url || "").trim(),
              (row.store_url || row.affiliate_url || "").trim(),
              (row.primary_color || "").trim(),
              JSON.stringify(tryParseJSON(row.secondary_colors || "")),
              JSON.stringify(tryParseJSON(row.season || row.seasons || "")),
              JSON.stringify(tryParseJSON(row.style || row.styles || "")),
              JSON.stringify(tryParseJSON(row.occasion || row.occasions || "")),
              JSON.stringify(tryParseJSON(row.material || row.materials || "")),
              (row.fit || "").trim(),
              (row.formality || "").trim(),
              (row.description || "").trim(),
            ]
          );

          if (q.rows.length === 0) {
            result.duplicates++;
            result.skipped++;
          } else {
            result.imported++;
          }
        } catch (err: any) {
          result.errors.push({ row: rowNum, field: "db", message: err.message?.slice(0, 100) || "Insert failed" });
          result.failed++;
        }
      }
    }

    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[admin/import] products error:", err.message);
    return res.status(500).json({ success: false, message: "Import failed." });
  }
});

// ─── Outfit Import ────────────────────────────────────────────────────────────

// POST /api/v1/admin/import/outfits (PROTECTED — admin only)
router.post("/outfits", adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { csv } = req.body;
    if (!csv || typeof csv !== "string") {
      return res.status(400).json({ success: false, message: "csv field (string) is required." });
    }

    const { headers, rows } = parseCSV(csv);
    if (!headers.includes("outfit_name")) {
      return res.status(400).json({ success: false, message: "CSV must have 'outfit_name' column." });
    }

    // Preload product slugs for validation
    const slugsQ = await db.query("SELECT slug FROM products", []);
    const validSlugs = new Set(slugsQ.rows.map((r) => r.slug));

    const result: ImportResult = { imported: 0, skipped: 0, failed: 0, duplicates: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      if (!row.outfit_name?.trim()) {
        result.errors.push({ row: rowNum, field: "outfit_name", message: "Outfit name is required" });
        result.failed++;
        continue;
      }

      // Validate product slugs
      const slugFields = ["top_product_slug", "bottom_product_slug", "shoes_product_slug", "layer_product_slug"];
      const productSlugs: string[] = [];
      let valid = true;

      for (const field of slugFields) {
        const slug = (row[field] || "").trim();
        if (slug) {
          if (!validSlugs.has(slug)) {
            result.errors.push({ row: rowNum, field, message: `Product slug "${slug}" not found` });
            valid = false;
          } else {
            productSlugs.push(slug);
          }
        }
      }

      if (!valid) { result.failed++; continue; }
      if (productSlugs.length === 0) {
        result.errors.push({ row: rowNum, field: "products", message: "At least one product slug is required" });
        result.failed++;
        continue;
      }

      try {
        // Insert outfit into a simple outfit_catalog table (or existing outfits if available)
        // For now, store as a product combination record
        await db.query(
          `INSERT INTO outfit_builds (user_id, name, product_ids, closet_item_ids)
           VALUES ('00000000-0000-0000-0000-000000000000', $1, $2, '{}')`,
          [row.outfit_name.trim(), productSlugs]
        );
        result.imported++;
      } catch (err: any) {
        if (err.code === "23505") { result.duplicates++; result.skipped++; }
        else { result.errors.push({ row: rowNum, field: "db", message: err.message?.slice(0, 100) || "Insert failed" }); result.failed++; }
      }
    }

    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[admin/import] outfits error:", err.message);
    return res.status(500).json({ success: false, message: "Import failed." });
  }
});

export default router;
