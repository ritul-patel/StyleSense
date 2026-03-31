import colorProfilesData from '../data/colorProfiles.json';

export type ColorProfile = {
  skin_tone: string;
  undertone: string;
  best_colors: string[];
  avoid_colors: string[];
  outfits: {
    name: string;
    description: string;
    pieces: string[];
  }[];
};

const colorProfiles = colorProfilesData as ColorProfile[];

// Pre-compute map for O(1) lookups and scalability
const profileMap = new Map<string, ColorProfile>();

colorProfiles.forEach((profile) => {
  const key = `${profile.skin_tone.toLowerCase()}_${profile.undertone.toLowerCase()}`;
  profileMap.set(key, profile);
});

const undertoneAliases: Record<string, string> = {
  warm: 'warm',
  'neutral-warm': 'warm',
  neutral: 'neutral',
  'neutral-cool': 'cool',
  cool: 'cool',
};

export const getRecommendation = (skinTone: string, undertone: string): ColorProfile => {
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
