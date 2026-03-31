"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendation = void 0;
const colorProfiles_json_1 = __importDefault(require("../data/colorProfiles.json"));
const colorProfiles = colorProfiles_json_1.default;
// Pre-compute map for O(1) lookups and scalability
const profileMap = new Map();
colorProfiles.forEach((profile) => {
    const key = `${profile.skin_tone.toLowerCase()}_${profile.undertone.toLowerCase()}`;
    profileMap.set(key, profile);
});
const undertoneAliases = {
    warm: 'warm',
    'neutral-warm': 'warm',
    neutral: 'neutral',
    'neutral-cool': 'cool',
    cool: 'cool',
};
const getRecommendation = (skinTone, undertone) => {
    // Safely sanitize inputs (guards against runtime non-string passing)
    const safeSkinTone = (typeof skinTone === 'string' ? skinTone : '').trim().toLowerCase();
    const rawUndertone = (typeof undertone === 'string' ? undertone : '').trim().toLowerCase();
    const safeUndertone = undertoneAliases[rawUndertone] || rawUndertone;
    const key = `${safeSkinTone}_${safeUndertone}`;
    const profile = profileMap.get(key);
    if (profile) {
        return profile;
    }
    // Fallback to a default safe combination (Medium Neutral) if matching fails
    const fallbackKey = 'medium_neutral';
    const fallbackProfile = profileMap.get(fallbackKey);
    if (!fallbackProfile) {
        throw new Error('Critical: Fallback color profile (Medium/Neutral) is missing from data.');
    }
    return fallbackProfile;
};
exports.getRecommendation = getRecommendation;
