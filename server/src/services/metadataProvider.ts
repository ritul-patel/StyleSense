/**
 * AI Product Metadata Provider System
 *
 * Architecture:
 *   ProductInput → PromptBuilder → Provider → RawOutput → Validator → GeneratedMetadata
 *
 * Providers:
 *   - ClaudeProvider (Anthropic) — active if ANTHROPIC_API_KEY is set
 *   - StubProvider — fallback when no provider configured
 *   - Future: GeminiProvider, OpenAIProvider, LocalVisionProvider
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductInput {
  name: string;
  brand: string;
  category: string;
  image_url?: string;
  primary_color?: string;
  description?: string;
}

export interface GeneratedMetadata {
  primary_color: string;
  secondary_colors: string[];
  material: string;
  pattern: string;
  fit: string;
  sleeve_type: string;
  neck_type: string;
  formality: string;
  style: string;
  occasion: string[];
  season: string[];
  temperature_suitability: string;
  recommended_undertones: string[];
  gender_category: string;
  product_type: string;
  description: string;
  keywords: string[];
  confidence: number;
}

export interface MetadataResult {
  success: boolean;
  metadata: GeneratedMetadata | null;
  provider: string;
  duration_ms: number;
  error?: string;
}

export interface MetadataProvider {
  name: string;
  supportsImage: boolean;
  generate(product: ProductInput, prompt: string): Promise<GeneratedMetadata>;
}

// ─── Valid Values (for validation) ─────────────────────────────────────────────

const VALID = {
  fit: ["slim", "regular", "relaxed", "oversized", "skinny", "loose", "tailored", ""],
  formality: ["casual", "smart-casual", "semi-formal", "formal", "athleisure", "streetwear", ""],
  sleeve_type: ["short", "long", "half", "sleeveless", "3/4", "rolled", "cap", "n/a", ""],
  neck_type: ["round", "v-neck", "crew", "polo", "mandarin", "spread", "button-down", "hooded", "n/a", ""],
  gender_category: ["men", "women", "unisex", ""],
  temperature_suitability: ["hot", "warm", "mild", "cool", "cold", "all-season", ""],
  season: ["spring", "summer", "autumn", "winter", "all-season"],
  occasion: ["daily", "office", "party", "date", "sports", "travel", "wedding", "casual", "formal"],
};

// ─── Prompt Builder ───────────────────────────────────────────────────────────

export function buildPrompt(product: ProductInput): string {
  return `You are a fashion product metadata analyzer. Analyze this product and return ONLY valid JSON.

Product Information:
- Name: ${product.name}
- Brand: ${product.brand || "Unknown"}
- Category: ${product.category || "Unknown"}
${product.primary_color ? `- Color hint: ${product.primary_color}` : ""}
${product.description ? `- Description: ${product.description}` : ""}
${product.image_url ? `- Image available for visual analysis` : ""}

Return a JSON object with EXACTLY these fields:
{
  "primary_color": "main color name (e.g. navy blue, beige, charcoal)",
  "secondary_colors": ["array of accent/trim colors"],
  "material": "primary fabric (e.g. cotton, linen, polyester, denim, leather)",
  "pattern": "pattern type (e.g. solid, striped, checked, printed, graphic)",
  "fit": "one of: slim, regular, relaxed, oversized, skinny, loose, tailored",
  "sleeve_type": "one of: short, long, half, sleeveless, 3/4, rolled, cap, n/a",
  "neck_type": "one of: round, v-neck, crew, polo, mandarin, spread, button-down, hooded, n/a",
  "formality": "one of: casual, smart-casual, semi-formal, formal, athleisure, streetwear",
  "style": "style category (e.g. minimalist, classic, streetwear, preppy, bohemian, sporty)",
  "occasion": ["array from: daily, office, party, date, sports, travel, wedding, casual, formal"],
  "season": ["array from: spring, summer, autumn, winter, all-season"],
  "temperature_suitability": "one of: hot, warm, mild, cool, cold, all-season",
  "recommended_undertones": ["array of skin undertones this suits: warm, cool, neutral"],
  "gender_category": "one of: men, women, unisex",
  "product_type": "specific type (e.g. oversized t-shirt, polo shirt, slim jeans, sneakers)",
  "description": "2-3 sentence description for shoppers",
  "keywords": ["array of 5-8 search keywords"],
  "confidence": 0.0 to 1.0 (your confidence in this analysis)
}

Rules:
- Return ONLY the JSON object, no markdown, no explanation.
- Use lowercase for all values except proper nouns in description.
- Be specific and accurate based on the product name and category.
- If uncertain about a field, use your best inference and lower the confidence.`;
}

// ─── Validator ────────────────────────────────────────────────────────────────

function clamp(val: unknown, validList: string[]): string {
  const s = String(val || "").toLowerCase().trim();
  return validList.includes(s) ? s : "";
}

function clampArray(val: unknown, validList: string[]): string[] {
  if (!Array.isArray(val)) return [];
  return val.map((v) => String(v).toLowerCase().trim()).filter((v) => validList.includes(v));
}

function strArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.map((v) => String(v).trim()).filter(Boolean).slice(0, 20);
}

export function validateMetadata(raw: unknown): GeneratedMetadata | null {
  if (typeof raw !== "object" || raw === null) return null;
  const d = raw as Record<string, unknown>;

  return {
    primary_color: String(d.primary_color || "").trim().slice(0, 50),
    secondary_colors: strArray(d.secondary_colors).slice(0, 5),
    material: String(d.material || "").trim().slice(0, 50),
    pattern: String(d.pattern || "").trim().slice(0, 30),
    fit: clamp(d.fit, VALID.fit),
    sleeve_type: clamp(d.sleeve_type, VALID.sleeve_type),
    neck_type: clamp(d.neck_type, VALID.neck_type),
    formality: clamp(d.formality, VALID.formality),
    style: String(d.style || "").trim().slice(0, 50),
    occasion: clampArray(d.occasion, VALID.occasion),
    season: clampArray(d.season, VALID.season),
    temperature_suitability: clamp(d.temperature_suitability, VALID.temperature_suitability),
    recommended_undertones: strArray(d.recommended_undertones).slice(0, 3),
    gender_category: clamp(d.gender_category, VALID.gender_category),
    product_type: String(d.product_type || "").trim().slice(0, 80),
    description: String(d.description || "").trim().slice(0, 500),
    keywords: strArray(d.keywords).slice(0, 10),
    confidence: Math.max(0, Math.min(1, Number(d.confidence) || 0)),
  };
}

// ─── Claude Provider (Anthropic) ──────────────────────────────────────────────

export class ClaudeMetadataProvider implements MetadataProvider {
  name = "claude";
  supportsImage = true;

  async generate(product: ProductInput, prompt: string): Promise<GeneratedMetadata> {
    const Anthropic = require("@anthropic-ai/sdk");
    const client = new Anthropic.default();

    const messages: any[] = [];
    const content: any[] = [];

    // Add image if available
    if (product.image_url && product.image_url.startsWith("http")) {
      content.push({
        type: "image",
        source: { type: "url", url: product.image_url },
      });
    }

    content.push({ type: "text", text: prompt });
    messages.push({ role: "user", content });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages,
    });

    // Extract text from response
    const text = response.content
      .filter((block: any) => block.type === "text")
      .map((block: any) => block.text)
      .join("");

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = validateMetadata(parsed);
    if (!validated) throw new Error("AI output failed validation");

    return validated;
  }
}

// ─── Stub Provider ────────────────────────────────────────────────────────────

export class StubMetadataProvider implements MetadataProvider {
  name = "stub";
  supportsImage = false;

  async generate(_product: ProductInput, _prompt: string): Promise<GeneratedMetadata> {
    return {
      primary_color: "",
      secondary_colors: [],
      material: "",
      pattern: "",
      fit: "",
      sleeve_type: "",
      neck_type: "",
      formality: "",
      style: "",
      occasion: [],
      season: [],
      temperature_suitability: "",
      recommended_undertones: [],
      gender_category: "",
      product_type: "",
      description: "",
      keywords: [],
      confidence: 0,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function getMetadataProvider(): MetadataProvider {
  if (process.env.GEMINI_API_KEY) {
    try {
      const { GeminiMetadataProvider } = require("./geminiMetadataService");
      return new GeminiMetadataProvider();
    } catch (err: any) {
      console.error("[metadata] Failed to load GeminiMetadataProvider:", err.message);
      // Fall through to next provider
    }
  }
  if (process.env.ANTHROPIC_API_KEY) return new ClaudeMetadataProvider();
  console.warn("[metadata] No AI provider configured (no GEMINI_API_KEY or ANTHROPIC_API_KEY). Using StubProvider.");
  return new StubMetadataProvider();
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function generateProductMetadata(product: ProductInput): Promise<MetadataResult> {
  const provider = getMetadataProvider();
  const prompt = buildPrompt(product);
  const start = Date.now();

  // Reject StubProvider — don't pretend to generate metadata
  if (provider.name === "stub") {
    return {
      success: false,
      metadata: null,
      provider: "stub",
      duration_ms: 0,
      error: "No AI provider configured. Set GEMINI_API_KEY in server/.env",
    };
  }

  try {
    const metadata = await provider.generate(product, prompt);

    // Reject empty/useless metadata
    if (!metadata.primary_color && !metadata.description && metadata.confidence === 0) {
      console.warn(`[metadata] Rejecting empty metadata from provider "${provider.name}" for "${product.name}"`);
      console.warn(`[metadata] Values: primary_color="${metadata.primary_color}" description="${metadata.description?.slice(0, 50)}" confidence=${metadata.confidence}`);
      return {
        success: false,
        metadata: null,
        provider: provider.name,
        duration_ms: Date.now() - start,
        error: "Provider returned empty metadata",
      };
    }

    return {
      success: true,
      metadata,
      provider: provider.name,
      duration_ms: Date.now() - start,
    };
  } catch (err: any) {
    console.error(`[metadata] Provider "${provider.name}" failed for "${product.name}":`, err.message);
    return {
      success: false,
      metadata: null,
      provider: provider.name,
      duration_ms: Date.now() - start,
      error: err.message,
    };
  }
}
