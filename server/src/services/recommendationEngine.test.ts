import { scoreProduct, type UserStyleProfile, type ProductMetadata } from "./recommendationEngine";

// ─── Test Profiles ────────────────────────────────────────────────────────────

const WARM_SPRING: UserStyleProfile = {
  skin_tone: "Type III",
  undertone: "warm",
  season: "Spring",
  best_colors: ["coral", "peach", "golden", "turquoise", "ivory", "camel"],
  avoid_colors: ["black", "dark grey", "burgundy"],
  confidence: 85,
};

const COOL_WINTER: UserStyleProfile = {
  skin_tone: "Type II",
  undertone: "cool",
  season: "Winter",
  best_colors: ["navy", "white", "emerald", "royal blue", "ruby", "black"],
  avoid_colors: ["orange", "rust", "mustard", "beige"],
  confidence: 90,
};

const SOFT_AUTUMN: UserStyleProfile = {
  skin_tone: "Type IV",
  undertone: "warm",
  season: "Autumn",
  best_colors: ["olive", "rust", "mustard", "forest green", "brown", "terracotta"],
  avoid_colors: ["bright pink", "neon", "icy blue"],
  confidence: 80,
};

const DEEP_WINTER: UserStyleProfile = {
  skin_tone: "Type VI",
  undertone: "cool",
  season: "Winter",
  best_colors: ["black", "white", "cobalt", "magenta", "emerald", "true red"],
  avoid_colors: ["pastel", "beige", "muted", "dusty"],
  confidence: 92,
};

// ─── Test Products ────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<ProductMetadata>): ProductMetadata {
  return {
    id: "test-1",
    name: "Test Product",
    brand: "TestBrand",
    category: "tshirt",
    price: 500,
    image_url: "",
    primary_color: "",
    secondary_colors: [],
    seasons: [],
    occasions: [],
    styles: [],
    materials: [],
    fit: "",
    formality: "",
    ai_metadata: null,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Recommendation Engine - scoreProduct", () => {
  describe("Color Scoring", () => {
    it("scores high for matching best color", () => {
      const product = makeProduct({ primary_color: "Coral" });
      const result = scoreProduct(product, WARM_SPRING);
      expect(result.score).toBeGreaterThan(30);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it("penalizes avoid colors", () => {
      const product = makeProduct({ primary_color: "Black" });
      const result = scoreProduct(product, WARM_SPRING);
      expect(result.negatives.length).toBeGreaterThan(0);
    });

    it("gives neutral bonus for safe colors", () => {
      const product = makeProduct({ primary_color: "White" });
      const result = scoreProduct(product, WARM_SPRING);
      expect(result.score).toBeGreaterThan(10);
    });
  });

  describe("Season Scoring", () => {
    it("boosts products tagged with user's season", () => {
      const product = makeProduct({ primary_color: "Beige", seasons: ["spring", "summer"] });
      const result = scoreProduct(product, WARM_SPRING);
      expect(result.breakdown.season).toBe(20);
    });

    it("gives no season bonus for mismatched seasons", () => {
      const product = makeProduct({ primary_color: "Beige", seasons: ["winter"] });
      const result = scoreProduct(product, WARM_SPRING);
      expect(result.breakdown.season).toBeLessThan(20);
    });
  });

  describe("Undertone Scoring", () => {
    it("scores higher for warm colors with warm undertone", () => {
      const product = makeProduct({ primary_color: "Rust" });
      const result = scoreProduct(product, SOFT_AUTUMN);
      expect(result.breakdown.undertone).toBeGreaterThanOrEqual(15);
    });

    it("scores higher for cool colors with cool undertone", () => {
      const product = makeProduct({ primary_color: "Navy" });
      const result = scoreProduct(product, COOL_WINTER);
      expect(result.breakdown.undertone).toBeGreaterThanOrEqual(15);
    });
  });

  describe("Profile Differentiation", () => {
    it("ranks differently for different profiles", () => {
      const coralProduct = makeProduct({ primary_color: "Coral", seasons: ["spring"] });
      const navyProduct = makeProduct({ primary_color: "Navy", seasons: ["winter"] });

      const springCoral = scoreProduct(coralProduct, WARM_SPRING);
      const springNavy = scoreProduct(navyProduct, WARM_SPRING);
      const winterCoral = scoreProduct(coralProduct, COOL_WINTER);
      const winterNavy = scoreProduct(navyProduct, COOL_WINTER);

      // Spring person should prefer coral
      expect(springCoral.score).toBeGreaterThan(springNavy.score);
      // Winter person should prefer navy
      expect(winterNavy.score).toBeGreaterThan(winterCoral.score);
    });

    it("Deep Winter prefers bold saturated colors", () => {
      const boldBlack = makeProduct({ primary_color: "Black", seasons: ["winter"] });
      const mutedBeige = makeProduct({ primary_color: "Beige", seasons: ["autumn"] });

      const blackScore = scoreProduct(boldBlack, DEEP_WINTER);
      const beigeScore = scoreProduct(mutedBeige, DEEP_WINTER);

      expect(blackScore.score).toBeGreaterThan(beigeScore.score);
    });

    it("Soft Autumn prefers earth tones over bright colors", () => {
      const olive = makeProduct({ primary_color: "Olive", seasons: ["autumn"] });
      const neonPink = makeProduct({ primary_color: "bright pink" });

      const oliveScore = scoreProduct(olive, SOFT_AUTUMN);
      const pinkScore = scoreProduct(neonPink, SOFT_AUTUMN);

      expect(oliveScore.score).toBeGreaterThan(pinkScore.score);
    });
  });

  describe("AI Metadata Bonus", () => {
    it("gives confidence adjustment for products with AI metadata", () => {
      const withAi = makeProduct({ primary_color: "Beige", ai_metadata: { recommended_undertones: ["warm"], confidence: 0.9, material: "cotton", fit: "relaxed" } });
      const withoutAi = makeProduct({ primary_color: "Beige" });

      const aiResult = scoreProduct(withAi, WARM_SPRING);
      const noAiResult = scoreProduct(withoutAi, WARM_SPRING);

      expect(aiResult.breakdown.confidence_adj).toBeGreaterThan(noAiResult.breakdown.confidence_adj);
    });

    it("uses AI recommended_undertones for precise matching", () => {
      const product = makeProduct({
        primary_color: "Teal",
        ai_metadata: { recommended_undertones: ["warm", "neutral"] },
      });
      const warmResult = scoreProduct(product, WARM_SPRING);
      const coolResult = scoreProduct(product, COOL_WINTER);

      expect(warmResult.breakdown.undertone).toBeGreaterThan(coolResult.breakdown.undertone);
    });
  });
});
