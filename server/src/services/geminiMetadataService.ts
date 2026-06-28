/**
 * Gemini Metadata Provider
 *
 * Uses Google Gemini 2.5 Flash with STRUCTURED OUTPUT (JSON Schema)
 * to guarantee valid JSON responses.
 *
 * The SDK's responseSchema parameter forces Gemini to return JSON
 * conforming to the exact schema — no markdown, no explanatory text.
 */

import { GoogleGenAI, Type } from "@google/genai";
import type { MetadataProvider, ProductInput, GeneratedMetadata } from "./metadataProvider";
import { validateMetadata } from "./metadataProvider";

const DEFAULT_MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 45_000;

function getModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

// ─── JSON Schema for structured output ──────────────────────────────────────
// This schema is sent to Gemini so it returns ONLY conformant JSON.

const METADATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    primary_color: { type: Type.STRING, description: "Main color name (e.g. navy blue, charcoal, beige)" },
    secondary_colors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Accent/trim colors" },
    material: { type: Type.STRING, description: "Primary fabric (cotton, linen, polyester, denim)" },
    pattern: { type: Type.STRING, description: "Pattern type (solid, striped, checked, printed, graphic)" },
    fit: { type: Type.STRING, description: "One of: slim, regular, relaxed, oversized, skinny, loose, tailored" },
    sleeve_type: { type: Type.STRING, description: "One of: short, long, half, sleeveless, 3/4, rolled, cap, n/a" },
    neck_type: { type: Type.STRING, description: "One of: round, v-neck, crew, polo, mandarin, spread, button-down, hooded, n/a" },
    formality: { type: Type.STRING, description: "One of: casual, smart-casual, semi-formal, formal, athleisure, streetwear" },
    style: { type: Type.STRING, description: "Style category (minimalist, classic, streetwear, preppy, sporty)" },
    occasion: { type: Type.ARRAY, items: { type: Type.STRING }, description: "From: daily, office, party, date, sports, travel, casual, formal" },
    season: { type: Type.ARRAY, items: { type: Type.STRING }, description: "From: spring, summer, autumn, winter, all-season" },
    temperature_suitability: { type: Type.STRING, description: "One of: hot, warm, mild, cool, cold, all-season" },
    recommended_undertones: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Undertones this suits: warm, cool, neutral" },
    gender_category: { type: Type.STRING, description: "One of: men, women, unisex" },
    product_type: { type: Type.STRING, description: "Specific type (oversized t-shirt, slim jeans, sneakers)" },
    description: { type: Type.STRING, description: "2-3 sentence description for shoppers" },
    keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5-8 search keywords" },
    confidence: { type: Type.NUMBER, description: "Confidence 0.0 to 1.0" },
  },
  required: [
    "primary_color", "secondary_colors", "material", "pattern", "fit",
    "formality", "style", "occasion", "season", "gender_category",
    "product_type", "description", "keywords", "confidence",
  ],
} as const;

// ─── Provider Class ─────────────────────────────────────────────────────────

let geminiRequestCounter = 0;

export class GeminiMetadataProvider implements MetadataProvider {
  name = "gemini";
  supportsImage = true;

  private client: GoogleGenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is required");
    this.client = new GoogleGenAI({ apiKey });
    this.model = getModel();
    // Task 7: Log key prefix and model (never full key)
    console.log(`[gemini] Initialized. Model: ${this.model}, Key prefix: ${apiKey.slice(0, 8)}...`);
  }

  async generate(product: ProductInput, prompt: string): Promise<GeneratedMetadata> {
    const startMs = Date.now();

    // Build request parts
    const parts: Array<any> = [];

    // Add image if available
    if (product.image_url && product.image_url.startsWith("http")) {
      try {
        const imageData = await this.fetchImageAsBase64(product.image_url);
        if (imageData) {
          parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } });
        }
      } catch (err) {
        console.warn(`[gemini] Image fetch failed for "${product.name}": ${(err as Error).message}`);
      }
    }

    parts.push({ text: prompt });

    // Attempt 1: with structured output schema
    let responseText: string;
    try {
      responseText = await this.callGemini(parts, "single", product.name);
    } catch (err) {
      throw new Error(`Gemini API call failed: ${(err as Error).message}`);
    }

    console.log(`[gemini:parse] Raw response length: ${responseText.length}`);
    console.log(`[gemini:parse] Raw preview: ${responseText.slice(0, 150)}`);

    // Parse response
    let parsed = this.parseResponse(responseText, product.name);

    if (parsed) {
      console.log(`[gemini:parse] ✓ Parsed successfully. Keys: ${Object.keys(parsed).join(", ")}`);
    }

    // If parsing failed, retry once
    if (!parsed) {
      console.warn(`[gemini:parse] ✗ Parse failed for "${product.name}". Retrying...`);
      console.warn(`[gemini:parse] Full raw response:\n${responseText}`);
      try {
        responseText = await this.callGemini(parts, "retry", product.name);
        parsed = this.parseResponse(responseText, product.name);
      } catch {
        // Retry call itself failed
      }

      if (!parsed) {
        throw new Error(`Gemini returned unparseable response for "${product.name}". Check logs for raw output.`);
      }
    }

    // Validate through shared validator
    const validated = validateMetadata(parsed);
    if (!validated) {
      // This should never happen since validateMetadata only returns null for non-objects
      console.error(`[gemini:validate] validateMetadata returned null. Input:`, JSON.stringify(parsed).slice(0, 300));
      throw new Error("Gemini output failed metadata validation");
    }

    // Verify the validated object has substance
    console.log(`[gemini:validate] ✓ primary_color="${validated.primary_color}" confidence=${validated.confidence} keywords=${validated.keywords.length}`);

    const durationMs = Date.now() - startMs;
    console.log(`[gemini] ✓ "${product.name}" — ${durationMs}ms`);

    return validated;
  }

  // ─── Private Methods ────────────────────────────────────────────────────────

  private async callGemini(parts: Array<any>, productId?: string, productName?: string): Promise<string> {
    geminiRequestCounter++;
    const reqNum = geminiRequestCounter;
    const startTime = Date.now();

    console.log(`[gemini:req#${reqNum}] ──────────────────────────────────────`);
    console.log(`[gemini:req#${reqNum}] Timestamp: ${new Date().toISOString()}`);
    console.log(`[gemini:req#${reqNum}] Product: "${productName}" (${productId})`);
    console.log(`[gemini:req#${reqNum}] Model: ${this.model}`);
    console.log(`[gemini:req#${reqNum}] Sending request...`);

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: [{ role: "user", parts }],
        config: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
          responseSchema: METADATA_SCHEMA,
        },
      });

      const elapsed = Date.now() - startTime;

      // Extract text safely
      let text: string;
      try {
        text = response.text ?? "";
      } catch (textErr: any) {
        console.error(`[gemini:req#${reqNum}] response.text THREW: ${textErr.message}`);
        const fallback = (response as any).candidates?.[0]?.content?.parts?.[0]?.text;
        text = fallback ? String(fallback) : "";
      }

      // Log response details
      const candidate = (response as any).candidates?.[0];
      const finishReason = candidate?.finishReason || "unknown";
      const usageMetadata = (response as any).usageMetadata;

      console.log(`[gemini:req#${reqNum}] ✓ Response received in ${elapsed}ms`);
      console.log(`[gemini:req#${reqNum}] Status: OK`);
      console.log(`[gemini:req#${reqNum}] Finish reason: ${finishReason}`);
      console.log(`[gemini:req#${reqNum}] Text length: ${text.length}`);
      if (usageMetadata) {
        console.log(`[gemini:req#${reqNum}] Tokens — prompt: ${usageMetadata.promptTokenCount}, response: ${usageMetadata.candidatesTokenCount}, total: ${usageMetadata.totalTokenCount}`);
      }
      console.log(`[gemini:req#${reqNum}] ──────────────────────────────────────`);

      if (!text) {
        throw new Error(`Empty response (finishReason: ${finishReason})`);
      }

      return text;
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      const status = err.status || err.httpStatusCode || "unknown";

      console.error(`[gemini:req#${reqNum}] ✗ FAILED in ${elapsed}ms`);
      console.error(`[gemini:req#${reqNum}] HTTP status: ${status}`);
      console.error(`[gemini:req#${reqNum}] Error: ${err.message}`);
      console.error(`[gemini:req#${reqNum}] ──────────────────────────────────────`);

      if (status === 429 || err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("Rate limited (429)");
      }
      if (status === 404 || err.message?.includes("NOT_FOUND")) {
        throw new Error(`Model "${this.model}" not found (404)`);
      }
      throw err;
    }
  }

  private parseResponse(text: string, productName: string): Record<string, unknown> | null {
    // STEP 3: Detailed parse logging

    // 1. Direct parse (expected path with structured output)
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        // STEP 4: successful parse
        console.log(`[gemini:parse] ✓ Direct JSON.parse succeeded. Keys: ${Object.keys(parsed).join(", ")}`);
        return parsed;
      }
      console.warn(`[gemini:parse] JSON.parse succeeded but result is not an object: ${typeof parsed}, isArray: ${Array.isArray(parsed)}`);
    } catch (e: any) {
      console.warn(`[gemini:parse] Direct JSON.parse failed: ${e.message}`);
      console.warn(`[gemini:parse] Input length: ${text.length}, first 100: "${text.slice(0, 100)}", last 100: "${text.slice(-100)}"`);
    }

    // 2. Strip markdown fences if somehow present
    const stripped = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    try {
      const parsed = JSON.parse(stripped);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        console.log(`[gemini:parse] ✓ Stripped-fences parse succeeded.`);
        return parsed;
      }
    } catch { /* fall through */ }

    // 3. Extract JSON object from text
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          console.log(`[gemini:parse] ✓ Regex-extracted JSON parse succeeded.`);
          return parsed;
        }
      } catch { /* fall through */ }
    }

    // 4. Total failure
    console.error(`[gemini:parse] ❌ ALL PARSE ATTEMPTS FAILED for "${productName}"`);
    console.error(`[gemini:parse] Raw length: ${text.length}`);
    console.error(`[gemini:parse] First 300 chars: ${text.slice(0, 300)}`);
    console.error(`[gemini:parse] Last 100 chars: ${text.slice(-100)}`);

    return null;
  }

  private async fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "StyleSense-MetadataBot/1.0" },
      });

      if (!response.ok) return null;

      const contentType = response.headers.get("content-type") || "image/jpeg";
      const mimeType = contentType.split(";")[0].trim();
      if (!mimeType.startsWith("image/")) return null;

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > 4 * 1024 * 1024) return null;

      return { base64: buffer.toString("base64"), mimeType };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
