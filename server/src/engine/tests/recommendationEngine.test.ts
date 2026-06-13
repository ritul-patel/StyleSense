import { getRecommendation } from "../recommendationEngine";

describe("getRecommendation", () => {
  it("returns safe values for core display fields", async () => {
    const result = await getRecommendation({
      fitzpatrick_type: "IV",
      undertone: "warm",
      rgb: [154, 121, 108],
    });

    expect(result).toBeDefined();
    expect(typeof result.profile.hex_derived).toBe("string");
    expect(result.profile.hex_derived.length).toBeGreaterThan(0);
    expect(typeof result.profile.detected_season).toBe("string");
    expect(result.profile.detected_season.length).toBeGreaterThan(0);
    expect(Array.isArray(result.best_colors)).toBe(true);
    expect(result.best_colors.length).toBeGreaterThan(0);
    expect(typeof result.best_colors[0].name).toBe("string");
    expect(typeof result.best_colors[0].hex).toBe("string");
    expect(Array.isArray(result.outfits)).toBe(true);
    expect(result.outfits.length).toBeGreaterThan(0);
    expect(typeof result.outfits[0].title).toBe("string");
    expect(typeof result.outfits[0].description).toBe("string");
  });

  it("handles deep neutral type", async () => {
    const result = await getRecommendation({
      fitzpatrick_type: "V",
      undertone: "neutral",
      rgb: [80, 60, 55],
    });

    expect(result.profile.hex_derived).toBeTruthy();
    expect(result.profile.detected_season).toBeTruthy();
    expect(result.best_colors.length).toBeGreaterThan(0);
    expect(result.outfits.length).toBeGreaterThan(0);
  });

  it("covers all 6 Fitzpatrick types without throwing", () => {
    const types = ["I", "II", "III", "IV", "V", "VI"] as const;
    const undertones = ["warm", "cool", "neutral"] as const;
    for (const t of types) {
      for (const u of undertones) {
        expect(() => getRecommendation({ fitzpatrick_type: t, undertone: u, rgb: [128, 100, 90] })).not.toThrow();
      }
    }
  });
});
