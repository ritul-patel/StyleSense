"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const recommendationEngine_1 = require("../recommendationEngine");
describe('getRecommendation Engine', () => {
    it('should fetch all 9 primary combinations accurately', () => {
        const combos = [
            { tone: 'Light', undertone: 'Cool' },
            { tone: 'Light', undertone: 'Warm' },
            { tone: 'Light', undertone: 'Neutral' },
            { tone: 'Medium', undertone: 'Cool' },
            { tone: 'Medium', undertone: 'Warm' },
            { tone: 'Medium', undertone: 'Neutral' },
            { tone: 'Dark', undertone: 'Cool' },
            { tone: 'Dark', undertone: 'Warm' },
            { tone: 'Dark', undertone: 'Neutral' },
        ];
        combos.forEach(({ tone, undertone }) => {
            const result = (0, recommendationEngine_1.getRecommendation)(tone, undertone);
            expect(result.skin_tone).toBe(tone);
            expect(result.undertone).toBe(undertone);
            expect(result.best_colors.length).toBeGreaterThan(0);
            expect(result.avoid_colors.length).toBeGreaterThan(0);
            expect(result.outfits.length).toBeGreaterThan(0);
        });
    });
    it('should return the correct profile for specific combinations smoothly', () => {
        const result = (0, recommendationEngine_1.getRecommendation)('Light', 'Cool');
        expect(result).toBeDefined();
        expect(result.skin_tone).toBe('Light');
        expect(result.undertone).toBe('Cool');
        expect(result.best_colors).toEqual(['Sky Blue', 'Lavender', 'Ruby Red']);
    });
    it('should be case-insensitive and handle whitespace and padding gracefully', () => {
        const result = (0, recommendationEngine_1.getRecommendation)(' liGHT  ', '   cOOl ');
        expect(result).toBeDefined();
        expect(result.skin_tone).toBe('Light');
        expect(result.undertone).toBe('Cool');
    });
    it('should fallback to Medium/Neutral for completely missing combinations', () => {
        const result = (0, recommendationEngine_1.getRecommendation)('Alien', 'Green');
        expect(result).toBeDefined();
        expect(result.skin_tone).toBe('Medium');
        expect(result.undertone).toBe('Neutral');
    });
    it('should handle undefined/null maliciously passed inputs gracefully and fallback', () => {
        // @ts-expect-error testing invalid implementation inputs coming from raw requests
        const result = (0, recommendationEngine_1.getRecommendation)(null, undefined);
        expect(result).toBeDefined();
        expect(result.skin_tone).toBe('Medium');
        expect(result.undertone).toBe('Neutral');
    });
    it('should handle empty strings mapped to the safe fallback', () => {
        const result = (0, recommendationEngine_1.getRecommendation)('', '');
        expect(result.skin_tone).toBe('Medium');
        expect(result.undertone).toBe('Neutral');
    });
});
