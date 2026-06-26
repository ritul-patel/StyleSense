import type { ColorEntry, AvoidColor, Outfit, Material, Accessory, ConfidenceReason, SignatureColor } from "../types/analysis";

export type { ColorEntry, AvoidColor, Outfit, Material, Accessory };

export type FitzpatrickType = "I" | "II" | "III" | "IV" | "V" | "VI";

export interface SkinProfile {
  fitzpatrick_type: FitzpatrickType;
  undertone: string;
  rgb: number[];
  hex?: string;
  brightness?: number;
  saturation?: number;
  ita_angle?: number;
}

export interface RecommendationResult {
  profile: {
    detected_season: string;
    tone_description: string;
    undertone_notes: string;
    hex_derived: string;
  };
  best_colors: ColorEntry[];
  avoid_colors: AvoidColor[];
  outfits: Outfit[];
  style_rules: string[];
  season_explanation: string;
  materials: Material[];
  accessories: Accessory[];
  confidence: { score: number; explanation: string };
  confidence_reason?: ConfidenceReason;
  signature_colors?: SignatureColor[];
  skin_description?: string;
  next_steps?: string[];
}

// ─── Palette data ─────────────────────────────────────────────────────────────

const P: Record<string, Omit<RecommendationResult, "profile" | "confidence">> = {

  // ── TYPE I COOL ──────────────────────────────────────────────────────────────
  "I_cool": {
    best_colors: [
      { name: "Pure White",      hex: "#FFFFFF", why: "Crisp contrast against very pale cool skin.",        usage: "tops, shirts",          group: "neutrals"   },
      { name: "True Black",      hex: "#1A1A1A", why: "Maximum contrast flatters Type I high-contrast look.", usage: "trousers, outerwear",  group: "neutrals"   },
      { name: "True Red",        hex: "#CC1010", why: "Clear cool red with no orange — jewel-bright pop.",  usage: "statement tops",        group: "statement"  },
      { name: "Royal Blue",      hex: "#2040B0", why: "Clear cool blue amplifies pale cool skin.",          usage: "blazers, dresses",      group: "statement"  },
      { name: "Emerald",         hex: "#007A50", why: "Cool jewel green creates vivid contrast.",           usage: "tops, accessories",     group: "statement"  },
      { name: "Raspberry",       hex: "#C02848", why: "Cool pink-red flatters without warmth clash.",       usage: "tops, dresses",         group: "statement"  },
      { name: "Icy Pink",        hex: "#F5D8E8", why: "Pale cool pink echoes the skin's cool base.",        usage: "blouses, dresses",      group: "everyday"   },
      { name: "Icy Violet",      hex: "#E0D0F4", why: "Light lavender stays in the cool family.",           usage: "tops, scarves",         group: "everyday"   },
      { name: "Navy",            hex: "#1A2060", why: "Deep cool dark — softer than black, same impact.",   usage: "trousers, jackets",     group: "neutrals"   },
      { name: "Charcoal",        hex: "#3E3E50", why: "Cool-tinted dark neutral anchors all looks.",        usage: "trousers, blazers",     group: "neutrals"   },
      { name: "Magenta",         hex: "#C80880", why: "Cool bright accent pops on very pale skin.",         usage: "accessories, accents",  group: "accent"     },
      { name: "Silver Grey",     hex: "#8090A0", why: "Cool mid-tone neutral bridges light and dark.",      usage: "knitwear, trousers",    group: "neutrals"   },
    ],
    avoid_colors: [
      { name: "Orange",          hex: "#FF6600", reason: "Warm hue clashes with cool pale skin.",           effect: "washed out"     },
      { name: "Mustard Yellow",  hex: "#D4A800", reason: "Yellow-green cast makes cool skin look sallow.",  effect: "sallow, ill"    },
      { name: "Camel",           hex: "#C19A6B", reason: "Warm brown too close to skin — no contrast.",     effect: "bland, draining"},
      { name: "Coral",           hex: "#FF6B55", reason: "Warm pink-orange fights cool undertone.",         effect: "harsh, clashing"},
      { name: "Warm Tan",        hex: "#C8A882", reason: "Warm beige washes pale cool complexion.",         effect: "faded, sickly"  },
      { name: "Terracotta",      hex: "#C26A4A", reason: "Earth-orange base incompatible with cool skin.",  effect: "ruddy, clashing"},
    ],
    outfits: [
      { title: "Winter Jewel",        description: "Black trousers, emerald silk blouse, silver-tone hardware belt.",  colors: ["#1A1A1A","#007A50","#C0C0C0"], occasion: "Office, smart events",  category: "formal",  season_suitability: "Autumn, Winter" },
      { title: "High Contrast Day",   description: "White structured shirt tucked into navy straight-leg trousers.",   colors: ["#FFFFFF","#1A2060"],            occasion: "Daily, office",        category: "daily",   season_suitability: "Year-round"     },
      { title: "Cool Evening",        description: "Raspberry wrap dress with charcoal strappy heels.",               colors: ["#C02848","#3E3E50"],            occasion: "Dinner, evening",      category: "party",   season_suitability: "Year-round"     },
      { title: "Icy Minimal",         description: "Icy violet knit with white wide-leg trousers and silver jewellery.", colors: ["#E0D0F4","#FFFFFF"],          occasion: "Weekend, brunch",      category: "minimal", season_suitability: "Spring, Summer" },
      { title: "Sharp Casual",        description: "Royal blue jacket over white tee and black jeans.",                colors: ["#2040B0","#FFFFFF","#1A1A1A"], occasion: "Casual smart",         category: "casual",  season_suitability: "Autumn, Winter" },
      { title: "Summer Contrast",     description: "True red linen dress with white sandals.",                        colors: ["#CC1010","#FFFFFF"],            occasion: "Summer outings",       category: "summer",  season_suitability: "Spring, Summer" },
    ],
    style_rules: [
      "Leverage your natural high contrast — dark bottoms + light tops work perfectly.",
      "Wear silver and white-gold metals only; yellow gold looks harsh against cool pale skin.",
      "Avoid all beige/camel near the face — they erase your natural contrast.",
      "Jewel tones (emerald, royal blue, raspberry) are your power colours.",
      "Icy pastels (icy pink, icy violet) work near the face; warm pastels do not.",
      "Black near the face is flattering — you have the contrast to carry it.",
      "Keep nail colours in cool family: berry, red-plum, nude-pink.",
    ],
    season_explanation: "Your colouring aligns with Clear Winter — defined by high contrast, cool undertones, and clarity. Build around a black/white/jewel-tone base for maximum impact.",
    materials: [
      { name: "Silk",        finish: "sheen",    note: "Amplifies the jewel tones natural to your palette." },
      { name: "Crisp Cotton",finish: "matte",    note: "Structured white cotton creates ideal contrast." },
      { name: "Cashmere",    finish: "textured", note: "Soft textures in icy tones work near the face." },
      { name: "Wool Crepe",  finish: "matte",    note: "Matte dark fabrics anchor high-contrast outfits." },
    ],
    accessories: [
      { type: "jewelry",   value: "Silver, white gold, platinum",      note: "Mirrors the cool tone in very pale skin." },
      { type: "shoes",     value: "Black leather or navy suede",       note: "Maintains dark-anchor of high-contrast outfits." },
      { type: "bags",      value: "Structured black or white",         note: "Clean contrast bags suit clear cool palette." },
      { type: "scarf",     value: "Icy pink or charcoal",              note: "Cool tones near face stay flattering." },
    ],
  },

  // ── TYPE I WARM ──────────────────────────────────────────────────────────────
  "I_warm": {
    best_colors: [
      { name: "Warm Ivory",    hex: "#FFF6E6", why: "Golden-white base flatters warm pale skin.",           usage: "tops, dresses",        group: "neutrals"  },
      { name: "Peach",         hex: "#FFBE9A", why: "Warm peachy tone in harmony with undertone.",          usage: "tops, blouses",        group: "everyday"  },
      { name: "Coral",         hex: "#FF7A60", why: "Warm coral brightens without clash.",                  usage: "statement tops",       group: "statement" },
      { name: "Butter Yellow", hex: "#FFE878", why: "Warm clear yellow lifts pale warm complexion.",        usage: "tops, accessories",    group: "statement" },
      { name: "Camel",         hex: "#C8A060", why: "Soft warm neutral echoes golden undertone.",           usage: "coats, trousers",      group: "neutrals"  },
      { name: "Warm Turquoise",hex: "#30C0B0", why: "Clear warm-leaning teal adds vivid contrast.",         usage: "tops, accessories",    group: "accent"    },
      { name: "Salmon",        hex: "#FF9080", why: "Warm pink-orange stays within undertone family.",      usage: "blouses, dresses",     group: "everyday"  },
      { name: "Spring Green",  hex: "#70C860", why: "Warm yellow-green brightens pale warm skin.",          usage: "tops, accessories",    group: "accent"    },
      { name: "Tomato Red",    hex: "#DD3020", why: "Warm clear red flatters without cool clash.",          usage: "statement pieces",     group: "statement" },
      { name: "Warm White",    hex: "#FFF5E0", why: "Creamy off-white avoids cold blue-whites.",            usage: "all basics",           group: "neutrals"  },
      { name: "Golden Tan",    hex: "#D4A060", why: "Warm mid-neutral grounds the palette.",               usage: "trousers, shoes",      group: "neutrals"  },
      { name: "Apricot",       hex: "#FFB870", why: "Soft warm orange-pink sits close to undertone.",      usage: "knitwear, scarves",    group: "everyday"  },
    ],
    avoid_colors: [
      { name: "Icy Blue",      hex: "#C8E4F4", reason: "Too cold — drains warmth from pale skin.",          effect: "washed out, cold"  },
      { name: "Pure Black",    hex: "#000000", reason: "Too stark against delicate warm fair skin.",         effect: "harsh, draining"   },
      { name: "Charcoal Grey", hex: "#505060", reason: "Cool grey fights the golden undertone.",             effect: "dull, sickly"      },
      { name: "Burgundy",      hex: "#700030", reason: "Too dark and cool — overwhelms light warm skin.",   effect: "heavy, draining"   },
      { name: "Cool Mauve",    hex: "#B090A8", reason: "Blue-pink base clashes with warm undertone.",        effect: "clashing, muddy"   },
    ],
    outfits: [
      { title: "Warm Spring Day",   description: "Peach blouse with camel linen trousers and golden sandals.",    colors: ["#FFBE9A","#C8A060","#D4A060"], occasion: "Weekend, brunch",     category: "casual",  season_suitability: "Spring, Summer" },
      { title: "Warm Bright",       description: "Coral wrap dress with warm ivory espadrilles.",                 colors: ["#FF7A60","#FFF6E6"],            occasion: "Summer events",       category: "summer",  season_suitability: "Spring, Summer" },
      { title: "Warm Office",       description: "Warm ivory blazer over butter-yellow top and camel trousers.",  colors: ["#FFF6E6","#FFE878","#C8A060"], occasion: "Office, smart casual", category: "formal",  season_suitability: "Spring, Autumn" },
      { title: "Cosy Warm",         description: "Salmon knit over warm ivory wide-leg trousers.",               colors: ["#FF9080","#FFF6E6"],            occasion: "Weekend, casual",     category: "minimal", season_suitability: "Autumn, Winter" },
      { title: "Vivid Accent",      description: "Warm turquoise top with golden tan shorts and apricot scarf.", colors: ["#30C0B0","#D4A060","#FFB870"], occasion: "Casual, travel",      category: "casual",  season_suitability: "Spring, Summer" },
      { title: "Warm Evening",      description: "Tomato red midi dress with camel strappy heels.",              colors: ["#DD3020","#C8A060"],            occasion: "Dinner, evening out", category: "party",   season_suitability: "Year-round"     },
    ],
    style_rules: [
      "Wear gold and rose-gold metals only — silver looks cold against your warm pale skin.",
      "Avoid pure white; use warm ivory, cream, or off-white instead.",
      "Avoid pure black; use warm brown or dark camel as your darkest neutral.",
      "Warm clears — coral, peach, tomato red — are your most flattering brights.",
      "Spring green and turquoise add vivid contrast without cool clash.",
      "Keep patterns in warm colour families: florals with peach/coral/yellow tones.",
    ],
    season_explanation: "Your colouring aligns with Light Spring — warm, clear, and delicate. Warm bright clears and peachy tones define this season's best palette.",
    materials: [
      { name: "Linen",        finish: "matte",    note: "Light matte fabric suits spring/summer warm looks." },
      { name: "Cotton Jersey",finish: "matte",    note: "Soft matte basics in warm neutrals are everyday staples." },
      { name: "Silk Chiffon", finish: "sheen",    note: "Lightweight sheen in coral/peach is flattering." },
      { name: "Cashmere",     finish: "textured", note: "Soft texture in warm ivory or camel for colder months." },
    ],
    accessories: [
      { type: "jewelry",   value: "Gold, rose gold",             note: "Echoes the yellow-warm base of your undertone." },
      { type: "shoes",     value: "Camel, nude-warm, tan leather", note: "Warm neutrals ground the palette seamlessly." },
      { type: "bags",      value: "Tan leather or warm ivory",    note: "Stays within warm palette family." },
      { type: "scarf",     value: "Peach or apricot",             note: "Warm peachy tones flatter near the face." },
    ],
  },

  // ── TYPE I NEUTRAL ───────────────────────────────────────────────────────────
  "I_neutral": {
    best_colors: [
      { name: "Soft White",    hex: "#F4F2F0", why: "Balanced off-white flatters neutral pale skin.",     usage: "tops, dresses",       group: "neutrals"  },
      { name: "Dusty Rose",    hex: "#D4A0A0", why: "Muted pink sits between warm and cool perfectly.",  usage: "tops, blouses",       group: "everyday"  },
      { name: "Lavender Grey", hex: "#C8C0D0", why: "Cool-neutral, soft, works with neutral pale skin.", usage: "knitwear, scarves",   group: "everyday"  },
      { name: "Blush Peach",   hex: "#F0C8B0", why: "Soft peachy tone adds warmth without clashing.",    usage: "tops, blouses",       group: "everyday"  },
      { name: "Greige",        hex: "#C8B8A8", why: "True warm-cool neutral bridge.",                    usage: "trousers, cardigans", group: "neutrals"  },
      { name: "Powder Blue",   hex: "#B8D0E0", why: "Soft muted blue-neutral flatters pale skin.",       usage: "shirts, dresses",     group: "everyday"  },
      { name: "Sage",          hex: "#9AB090", why: "Muted green-grey suits neutral undertones.",        usage: "trousers, outerwear", group: "accent"    },
      { name: "Soft Coral",    hex: "#F0A090", why: "Muted warm-cool coral flatters both directions.",   usage: "statement tops",      group: "statement" },
      { name: "Cool Taupe",    hex: "#B0A898", why: "Balanced taupe neutralises skin-tone well.",        usage: "trousers, basics",    group: "neutrals"  },
      { name: "Berry",         hex: "#A04878", why: "Muted cool-warm berry adds depth.",                 usage: "statement pieces",    group: "statement" },
    ],
    avoid_colors: [
      { name: "Neon Yellow",   hex: "#FFFF00", reason: "Extreme chroma overwhelms delicate neutral skin.", effect: "washed out"    },
      { name: "Hot Pink",      hex: "#FF69B4", reason: "High saturation destabilises neutral balance.",    effect: "clashing"      },
      { name: "Orange",        hex: "#FF6600", reason: "Strong warm hue fights neutral pale skin.",        effect: "harsh"         },
      { name: "Cool Black",    hex: "#000033", reason: "Blue-black too stark for delicate pale skin.",     effect: "draining"      },
    ],
    outfits: [
      { title: "Soft Neutral",     description: "Lavender grey knit over greige trousers, sage green belt.",  colors: ["#C8C0D0","#C8B8A8","#9AB090"], occasion: "Office, casual",  category: "minimal", season_suitability: "Year-round"     },
      { title: "Dusty Bloom",      description: "Dusty rose blouse with cool taupe wide-leg trousers.",       colors: ["#D4A0A0","#B0A898"],            occasion: "Brunch, casual", category: "casual",  season_suitability: "Spring, Summer" },
      { title: "Soft Pop",         description: "Soft coral dress with greige sandals.",                      colors: ["#F0A090","#C8B8A8"],            occasion: "Casual events", category: "summer",  season_suitability: "Spring, Summer" },
    ],
    style_rules: [
      "Both gold and silver metals work — match the outfit's colour temperature.",
      "Muted tones flatter more than bright saturated colours.",
      "Avoid high-chroma colours near the face; save them for accessories.",
      "Soft contrast (not stark black/white) works best.",
    ],
    season_explanation: "Your colouring aligns with Soft Summer — balanced neutral tones with gentle contrast. Muted, dusty, and soft hues define your most flattering palette.",
    materials: [
      { name: "Cotton",      finish: "matte",    note: "Soft matte basics in neutral tones are core." },
      { name: "Linen",       finish: "matte",    note: "Natural texture suits neutral spring/summer looks." },
      { name: "Jersey",      finish: "matte",    note: "Relaxed matte jersey in dusty tones for everyday." },
    ],
    accessories: [
      { type: "jewelry",   value: "Silver or gold (match outfit tone)", note: "Neutral skin works with both metals." },
      { type: "shoes",     value: "Greige, blush, or taupe",            note: "Soft neutral footwear grounds palette." },
    ],
  },

  // ── TYPE II COOL ─────────────────────────────────────────────────────────────
  "II_cool": {
    best_colors: [
      { name: "Rose White",      hex: "#FFF0F0", why: "Cool rose-tinted white matches fair cool skin.",      usage: "tops, dresses",        group: "neutrals"  },
      { name: "Dusty Rose",      hex: "#C89090", why: "Muted cool rose is a classic Summer flattery.",       usage: "tops, blouses",        group: "everyday"  },
      { name: "Mauve",           hex: "#A87890", why: "Blue-pink mauve echoes the cool undertone.",          usage: "tops, knitwear",       group: "everyday"  },
      { name: "Powder Blue",     hex: "#A0C0D8", why: "Soft cool blue flatters fair cool complexions.",      usage: "shirts, dresses",      group: "everyday"  },
      { name: "Lavender",        hex: "#B090C8", why: "Cool violet matches this season perfectly.",          usage: "blouses, accessories", group: "accent"    },
      { name: "Sapphire",        hex: "#2850A0", why: "Deeper cool blue adds jewel contrast.",              usage: "blazers, statement",   group: "statement" },
      { name: "Deep Rose",       hex: "#A03050", why: "Cool dark pink — polished and refined.",             usage: "statement pieces",     group: "statement" },
      { name: "Soft Grey",       hex: "#9898A8", why: "Cool mid-grey is a perfect neutral anchor.",         usage: "trousers, knitwear",   group: "neutrals"  },
      { name: "Dove White",      hex: "#E8E8F0", why: "Slightly cool white flatters without stark contrast.", usage: "tops, basics",       group: "neutrals"  },
      { name: "Steel Blue",      hex: "#5878A0", why: "Muted cool blue bridges everyday and formal.",       usage: "blazers, trousers",    group: "everyday"  },
      { name: "Soft Burgundy",   hex: "#883050", why: "Cool-leaning burgundy adds depth without warmth.",   usage: "outerwear, knitwear",  group: "statement" },
    ],
    avoid_colors: [
      { name: "Orange",          hex: "#FF6600", reason: "Warm hue clashes strongly with cool fair skin.",   effect: "harsh, clashing"  },
      { name: "Mustard",         hex: "#D4A800", reason: "Yellow-green makes fair cool skin look sallow.",   effect: "sallow, ill"      },
      { name: "Camel",           hex: "#C19A6B", reason: "Warm brown washes out cool fair complexion.",      effect: "bland"            },
      { name: "Warm Peach",      hex: "#FFAA80", reason: "Warm orange-pink fights cool undertone.",          effect: "ruddy, clashing"  },
      { name: "Olive",           hex: "#7A7A3A", reason: "Yellow-green dulls cool fair skin tone.",          effect: "dull, murky"      },
    ],
    outfits: [
      { title: "Summer Soft",     description: "Dusty rose blouse with soft grey wide-leg trousers.",         colors: ["#C89090","#9898A8"],            occasion: "Office, casual",   category: "daily",   season_suitability: "Spring, Summer" },
      { title: "Cool Classic",    description: "Powder blue shirt tucked into sapphire trousers.",            colors: ["#A0C0D8","#2850A0"],            occasion: "Smart casual",     category: "formal",  season_suitability: "Year-round"     },
      { title: "Lavender Day",    description: "Lavender midi dress with dove white sandals.",                colors: ["#B090C8","#E8E8F0"],            occasion: "Weekend, brunch",  category: "casual",  season_suitability: "Spring, Summer" },
      { title: "Cool Evening",    description: "Deep rose satin dress with silver accessories.",              colors: ["#A03050","#C0C0C0"],            occasion: "Dinner, evening",  category: "party",   season_suitability: "Autumn, Winter" },
      { title: "Muted Layers",    description: "Mauve knit over steel blue wide-leg trousers.",              colors: ["#A87890","#5878A0"],            occasion: "Casual, weekend",  category: "minimal", season_suitability: "Autumn, Winter" },
    ],
    style_rules: [
      "Muted, dusty, cool-toned colours are your core — avoid bright saturated warm tones.",
      "Silver jewellery is your metal; yellow gold creates a harsh contrast.",
      "True white is too stark — use dove white or rose white instead.",
      "Dusty rose and mauve are signature colours; wear them near the face freely.",
      "Sapphire and deep rose provide depth without warmth intrusion.",
    ],
    season_explanation: "Your colouring aligns with True Summer — soft, cool, and muted. Dusty rose, lavender, and powder blue form the foundation of your ideal palette.",
    materials: [
      { name: "Satin",        finish: "sheen",    note: "Cool sheen amplifies jewel tones for your palette." },
      { name: "Linen",        finish: "matte",    note: "Matte linen in dusty tones is an everyday staple." },
      { name: "Cashmere",     finish: "textured", note: "Soft knitwear in lavender or mauve is perfect." },
      { name: "Chiffon",      finish: "sheen",    note: "Lightweight sheen in soft cool tones flatters." },
    ],
    accessories: [
      { type: "jewelry",   value: "Silver, white gold",            note: "Cool metals match fair cool undertone." },
      { type: "shoes",     value: "Soft grey, nude-cool, mauve",   note: "Muted cool tones extend palette to footwear." },
      { type: "bags",      value: "Dusty rose or dove grey",       note: "Muted cool-toned bags suit Summer palette." },
    ],
  },

  // ── TYPE II WARM ─────────────────────────────────────────────────────────────
  "II_warm": {
    best_colors: [
      { name: "Warm Ivory",    hex: "#FFF3E0", why: "Warm creamy base suits fair warm skin.",              usage: "tops, basics",         group: "neutrals"  },
      { name: "Peach",         hex: "#FFBA90", why: "Warm peachy tone harmonises with undertone.",         usage: "blouses, dresses",     group: "everyday"  },
      { name: "Light Coral",   hex: "#FF8868", why: "Clear warm coral brightens fair warm skin.",          usage: "tops, statement",      group: "statement" },
      { name: "Golden Yellow", hex: "#F0D050", why: "Warm clear yellow lifts fair warm complexion.",       usage: "tops, accessories",    group: "accent"    },
      { name: "Warm Tan",      hex: "#C8A878", why: "Soft warm neutral anchors the palette.",              usage: "trousers, blazers",    group: "neutrals"  },
      { name: "Warm Teal",     hex: "#38A898", why: "Warm-leaning teal creates vivid contrast.",           usage: "tops, accessories",    group: "accent"    },
      { name: "Light Gold",    hex: "#D4B060", why: "Golden neutral echoes the warm undertone.",           usage: "accessories, shoes",   group: "neutrals"  },
      { name: "Warm Peach",    hex: "#FFB090", why: "Deeper peach stays in warm family.",                  usage: "dresses, blouses",     group: "everyday"  },
      { name: "Clear Warm Red",hex: "#D83020", why: "Warm clear red flatters fair warm skin.",             usage: "statement pieces",     group: "statement" },
      { name: "Cream",         hex: "#FFF8E8", why: "Softer than white, warm base flatters.",              usage: "all basics",           group: "neutrals"  },
    ],
    avoid_colors: [
      { name: "Icy Blue",      hex: "#C8E4F8", reason: "Cold tone drains warmth from fair skin.",          effect: "cold, washed out"  },
      { name: "Lavender",      hex: "#C0A8D8", reason: "Cool violet clashes with warm undertone.",          effect: "clashing, dull"    },
      { name: "Pure Black",    hex: "#000000", reason: "Too harsh for delicate fair warm skin.",            effect: "draining, harsh"   },
      { name: "Cool Mauve",    hex: "#B090A8", reason: "Blue-pink base fights warm undertone.",             effect: "muddy, clashing"   },
      { name: "Burgundy",      hex: "#700028", reason: "Too dark/cool for fair warm complexion.",           effect: "heavy, cold"       },
    ],
    outfits: [
      { title: "Warm Spring",  description: "Peach blouse with warm tan linen trousers and light gold sandals.",  colors: ["#FFBA90","#C8A878","#D4B060"], occasion: "Brunch, casual",    category: "casual",  season_suitability: "Spring, Summer" },
      { title: "Bright Warm",  description: "Light coral dress with cream strappy sandals.",                      colors: ["#FF8868","#FFF8E8"],            occasion: "Summer events",     category: "summer",  season_suitability: "Spring, Summer" },
      { title: "Warm Minimal", description: "Cream wide-leg trousers, warm teal top, gold jewellery.",           colors: ["#FFF8E8","#38A898","#D4B060"],  occasion: "Smart casual",      category: "minimal", season_suitability: "Spring, Summer" },
      { title: "Autumn Warm",  description: "Warm ivory blouse over warm tan blazer and golden trousers.",       colors: ["#FFF3E0","#C8A878","#D4B060"],  occasion: "Office, smart",     category: "formal",  season_suitability: "Autumn, Winter" },
    ],
    style_rules: [
      "Gold and rose-gold metals only — silver looks cold against fair warm skin.",
      "Swap pure white for warm ivory or cream.",
      "Coral and peach are your signature colours near the face.",
      "Warm teal and golden yellow are your best accent/contrast colours.",
    ],
    season_explanation: "Your colouring aligns with Warm Spring — fair, warm, and clear. Peachy, coral, and golden tones are your core palette for maximum flattery.",
    materials: [
      { name: "Linen",        finish: "matte",    note: "Warm-toned linen is a spring/summer essential." },
      { name: "Cotton",       finish: "matte",    note: "Soft cotton basics in peach and ivory." },
      { name: "Silk",         finish: "sheen",    note: "Warm sheen in coral or gold for evenings." },
    ],
    accessories: [
      { type: "jewelry",   value: "Gold, rose gold",          note: "Warm metals match fair warm undertone." },
      { type: "shoes",     value: "Tan, warm nude, camel",    note: "Warm neutrals ground the palette." },
    ],
  },

  // ── TYPE II NEUTRAL ──────────────────────────────────────────────────────────
  "II_neutral": {
    best_colors: [
      { name: "Blush",         hex: "#EEC8B8", why: "Soft warm-cool pink flatters neutral fair skin.",   usage: "tops, dresses",      group: "everyday"  },
      { name: "Greige",        hex: "#C8B8A8", why: "Balanced warm-cool neutral.",                       usage: "trousers, basics",   group: "neutrals"  },
      { name: "Dusty Lavender",hex: "#C0B0D0", why: "Muted neutral-cool violet flatters both ways.",    usage: "tops, scarves",      group: "everyday"  },
      { name: "Warm Grey",     hex: "#A8A090", why: "Grey with warm undertone bridges both sides.",      usage: "trousers, knitwear", group: "neutrals"  },
      { name: "Terracotta Soft",hex: "#D09070",why: "Muted warm-earth works for neutral fair skin.",    usage: "tops, accessories",  group: "statement" },
      { name: "Muted Teal",    hex: "#609898", why: "Balanced blue-green suits neutral undertones.",    usage: "tops, blazers",      group: "accent"    },
      { name: "Rose Taupe",    hex: "#C0A8A0", why: "Soft rose-taupe bridges warm and cool.",           usage: "basics, trousers",   group: "neutrals"  },
    ],
    avoid_colors: [
      { name: "Neon Green",    hex: "#39FF14", reason: "Extreme chroma overwhelms neutral fair skin.",   effect: "washed out"    },
      { name: "Electric Blue", hex: "#0080FF", reason: "Too intense for muted neutral fair skin.",       effect: "overpowering"  },
      { name: "Hot Orange",    hex: "#FF5500", reason: "High-chroma warm tone clashes.",                 effect: "harsh"         },
    ],
    outfits: [
      { title: "Soft Balance",  description: "Greige trousers, blush top, muted teal scarf.",  colors: ["#C8B8A8","#EEC8B8","#609898"], occasion: "Casual, office", category: "minimal", season_suitability: "Year-round"     },
      { title: "Neutral Bloom", description: "Dusty lavender dress with rose taupe sandals.",  colors: ["#C0B0D0","#C0A8A0"],            occasion: "Weekend",       category: "casual",  season_suitability: "Spring, Summer" },
    ],
    style_rules: [
      "Both gold and silver work — choose based on outfit warmth.",
      "Muted, soft tones flatter more than bright saturated colours.",
      "Avoid high-chroma colours near the face.",
    ],
    season_explanation: "Your colouring aligns with Soft Summer — balanced, muted, gentle. Soft warm-cool blends define your palette.",
    materials: [
      { name: "Cotton", finish: "matte", note: "Matte soft basics in neutral tones." },
      { name: "Linen",  finish: "matte", note: "Natural texture for warmer seasons." },
    ],
    accessories: [
      { type: "jewelry", value: "Silver or gold (match outfit)", note: "Neutral skin suits both metals." },
      { type: "shoes",   value: "Rose taupe or greige",          note: "Neutral footwear stays cohesive." },
    ],
  },

  // ── TYPE III COOL ────────────────────────────────────────────────────────────
  "III_cool": {
    best_colors: [
      { name: "Rose Taupe",    hex: "#B09898", why: "Muted rose-cool neutral flatters light-medium cool skin.", usage: "tops, knitwear",      group: "neutrals"  },
      { name: "Dusty Blue",    hex: "#7898B8", why: "Soft cool blue is a core colour for this season.",        usage: "shirts, blouses",     group: "everyday"  },
      { name: "Steel Grey",    hex: "#7878A0", why: "Cool grey-blue mid-tone anchors all looks.",              usage: "trousers, blazers",   group: "neutrals"  },
      { name: "Deep Rose",     hex: "#A04060", why: "Cool dark pink provides depth for light-medium skin.",    usage: "statement pieces",    group: "statement" },
      { name: "Mauve",         hex: "#987890", why: "Cool-toned mauve echoes undertone naturally.",            usage: "tops, dresses",       group: "everyday"  },
      { name: "Soft Teal",     hex: "#509890", why: "Muted cool teal adds accent contrast.",                  usage: "tops, accessories",   group: "accent"    },
      { name: "Navy",          hex: "#1A2860", why: "Deep cool dark — perfect neutral anchor.",               usage: "trousers, outerwear", group: "neutrals"  },
      { name: "Cooled Plum",   hex: "#7050A0", why: "Cool purple adds depth appropriate to skin depth.",      usage: "statement tops",      group: "statement" },
      { name: "Dove Grey",     hex: "#A8A8B8", why: "Cool light neutral transitions well across seasons.",    usage: "basics, knitwear",    group: "neutrals"  },
      { name: "Deep Navy",     hex: "#182040", why: "Deepest cool neutral for polished looks.",               usage: "suits, outerwear",    group: "neutrals"  },
    ],
    avoid_colors: [
      { name: "Mustard",       hex: "#D4A800", reason: "Yellow-green pulls cool skin sallow.",                effect: "sallow, ill"      },
      { name: "Warm Orange",   hex: "#E06020", reason: "Warm hue clashes with cool undertone.",              effect: "clashing, ruddy"  },
      { name: "Camel",         hex: "#C09860", reason: "Warm brown drains cool complexion.",                  effect: "muddy, dull"      },
      { name: "Terracotta",    hex: "#C06848", reason: "Earth-orange fights cool undertone strongly.",        effect: "clashing"         },
      { name: "Warm Gold",     hex: "#D4A040", reason: "Yellow-warm gold looks discordant near face.",        effect: "harsh"            },
    ],
    outfits: [
      { title: "Cool Layers",    description: "Dusty blue shirt over mauve knit, steel grey trousers.",       colors: ["#7898B8","#987890","#7878A0"], occasion: "Office, smart",   category: "formal",  season_suitability: "Autumn, Winter" },
      { title: "Muted Contrast", description: "Deep rose top with navy straight trousers.",                   colors: ["#A04060","#1A2860"],            occasion: "Smart casual",    category: "daily",   season_suitability: "Year-round"     },
      { title: "Soft Cool Day",  description: "Rose taupe blouse with dove grey wide-leg trousers.",          colors: ["#B09898","#A8A8B8"],            occasion: "Casual, brunch",  category: "minimal", season_suitability: "Spring, Summer" },
      { title: "Cool Evening",   description: "Cooled plum dress with silver accessories and navy bag.",      colors: ["#7050A0","#C0C0C0","#1A2860"], occasion: "Evening, dinner", category: "party",   season_suitability: "Autumn, Winter" },
    ],
    style_rules: [
      "Silver jewellery always — yellow gold clashes with cool undertone.",
      "Navy and steel grey are your most versatile neutral anchors.",
      "Muted cool tones work better than bright saturated colours.",
      "Deep rose and plum are your best statement choices.",
      "Avoid all warm earth tones near the face.",
    ],
    season_explanation: "Your colouring aligns with Soft Summer or True Summer — muted, cool, and medium in depth. Dusty blue, rose taupe, and cool grey form your palette core.",
    materials: [
      { name: "Satin",        finish: "sheen",    note: "Cool sheen suits jewel tones in evening looks." },
      { name: "Wool Crepe",   finish: "matte",    note: "Structured matte in navy or steel for daywear." },
      { name: "Cotton",       finish: "matte",    note: "Soft matte basics in dusty cool tones." },
    ],
    accessories: [
      { type: "jewelry", value: "Silver, white gold",          note: "Cool metals match this undertone." },
      { type: "shoes",   value: "Navy, dove grey, rose taupe", note: "Stay in cool neutral family." },
    ],
  },

  // ── TYPE III WARM ────────────────────────────────────────────────────────────
  "III_warm": {
    best_colors: [
      { name: "Warm Taupe",    hex: "#A89080", why: "Earthy warm neutral flatters light-medium warm skin.", usage: "trousers, blazers",   group: "neutrals"  },
      { name: "Terracotta",    hex: "#C86848", why: "Earthy red-orange aligns with warm undertone.",        usage: "tops, statement",     group: "statement" },
      { name: "Moss Green",    hex: "#788040", why: "Yellow-green earthy tone matches warm skin.",          usage: "trousers, outerwear", group: "everyday"  },
      { name: "Warm Rust",     hex: "#B85030", why: "Rusty warm red harmonises with warm undertone.",      usage: "statement tops",      group: "statement" },
      { name: "Olive",         hex: "#7A7A38", why: "Yellow-green anchors warm earth palettes.",            usage: "trousers, outerwear", group: "everyday"  },
      { name: "Camel",         hex: "#C8A060", why: "Golden-warm neutral echoes undertone warmth.",         usage: "coats, trousers",     group: "neutrals"  },
      { name: "Warm Ivory",    hex: "#FFF3E0", why: "Creamy warm base avoids cold blue-whites.",            usage: "tops, dresses",       group: "neutrals"  },
      { name: "Burnt Sienna",  hex: "#A84828", why: "Warm dark brown creates depth for medium skin.",      usage: "accessories, outerwear", group: "statement"},
      { name: "Dusty Apricot", hex: "#E0A878", why: "Warm-muted peachy tone near the face.",               usage: "blouses, knitwear",   group: "everyday"  },
      { name: "Forest Green",  hex: "#386830", why: "Deep warm green provides rich contrast.",              usage: "outerwear, statement",group: "accent"    },
    ],
    avoid_colors: [
      { name: "Icy Blue",      hex: "#C8E4F8", reason: "Cool tone clashes with warm undertone.",             effect: "cold, discordant" },
      { name: "Cool Pink",     hex: "#E898C0", reason: "Blue-pink fights warm undertone.",                   effect: "clashing"         },
      { name: "Silver Grey",   hex: "#9898A8", reason: "Cool grey dulls warm medium skin.",                  effect: "dull, cold"       },
      { name: "Lavender",      hex: "#C0A8D8", reason: "Cool violet clashes with warm skin.",                effect: "muddy, clashing"  },
      { name: "Cool Black",    hex: "#202030", reason: "Blue-black too cool for warm undertone.",             effect: "harsh, cold"      },
    ],
    outfits: [
      { title: "Earthy Day",    description: "Olive trousers, warm ivory blouse, camel leather belt.",        colors: ["#7A7A38","#FFF3E0","#C8A060"],  occasion: "Casual, office",    category: "casual",  season_suitability: "Autumn, Spring" },
      { title: "Warm Statement",description: "Terracotta top with warm taupe wide-leg trousers.",             colors: ["#C86848","#A89080"],             occasion: "Smart casual",      category: "daily",   season_suitability: "Autumn, Winter" },
      { title: "Warm Evening",  description: "Warm rust midi dress with cognac heels.",                       colors: ["#B85030","#A86040"],             occasion: "Dinner, evening",   category: "party",   season_suitability: "Autumn, Winter" },
      { title: "Warm Layers",   description: "Forest green jacket over dusty apricot blouse and camel trousers.", colors: ["#386830","#E0A878","#C8A060"], occasion: "Weekend, outings", category: "minimal", season_suitability: "Autumn, Spring" },
    ],
    style_rules: [
      "Gold-tone metals only — silver clashes with warm undertone.",
      "Build outfits from earth-tone base: camel, olive, warm taupe.",
      "Terracotta and rust are signature statement colours for your type.",
      "Avoid all icy or cool tones near the face.",
      "Warm ivory is your white — use it instead of pure white.",
    ],
    season_explanation: "Your colouring aligns with Warm Autumn or Light Autumn — medium depth, warm, and earthy. Terracotta, moss, and camel are your palette anchors.",
    materials: [
      { name: "Matte Cotton",  finish: "matte",    note: "Earthy matte tones in camel and olive." },
      { name: "Linen",         finish: "matte",    note: "Natural texture suits warm autumn palettes." },
      { name: "Suede",         finish: "textured", note: "Warm suede in rust or tan for accessories." },
      { name: "Wool",          finish: "textured", note: "Textured wool in earthy tones for autumn." },
    ],
    accessories: [
      { type: "jewelry", value: "Gold, bronze, copper",        note: "Warm metals echo the earthy undertone." },
      { type: "shoes",   value: "Cognac, tan, warm brown",     note: "Earth-tone footwear stays within palette." },
      { type: "bags",    value: "Tan leather or olive suede",  note: "Warm neutral bags ground earth outfits." },
    ],
  },

  // ── TYPE III NEUTRAL ─────────────────────────────────────────────────────────
  "III_neutral": {
    best_colors: [
      { name: "Warm Greige",   hex: "#C0B0A0", why: "Balanced warm-cool neutral suits medium skin.",    usage: "trousers, basics",    group: "neutrals"  },
      { name: "Sage",          hex: "#9AB088", why: "Muted green-grey sits in neutral palette.",        usage: "tops, outerwear",     group: "everyday"  },
      { name: "Dusty Mauve",   hex: "#A88898", why: "Soft neutral-pink complements neutral undertone.", usage: "tops, dresses",       group: "everyday"  },
      { name: "Warm Teal",     hex: "#508888", why: "Balanced teal bridges warm and cool.",             usage: "tops, accessories",   group: "accent"    },
      { name: "Sand",          hex: "#D4C4A0", why: "Warm sand neutral flatters medium skin.",          usage: "trousers, dresses",   group: "neutrals"  },
      { name: "Muted Brick",   hex: "#B07060", why: "Muted warm-earth tone, not too intense.",         usage: "statement pieces",    group: "statement" },
      { name: "Steel Blue",    hex: "#6080A8", why: "Mid-cool neutral works with neutral skin.",        usage: "shirts, blazers",     group: "everyday"  },
    ],
    avoid_colors: [
      { name: "Neon Yellow",   hex: "#FFFF00", reason: "Extreme chroma overwhelms neutral skin.",       effect: "washed out"    },
      { name: "Hot Pink",      hex: "#FF69B4", reason: "High-saturation clashes with neutral balance.", effect: "clashing"      },
      { name: "Electric Orange",hex: "#FF5500",reason: "Too intense for neutral medium skin.",          effect: "harsh"         },
    ],
    outfits: [
      { title: "Balanced Neutral", description: "Warm greige trousers, sage top, dusty mauve scarf.", colors: ["#C0B0A0","#9AB088","#A88898"], occasion: "Casual, office", category: "minimal", season_suitability: "Year-round" },
      { title: "Soft Contrast",    description: "Steel blue shirt with warm greige trousers.",         colors: ["#6080A8","#C0B0A0"],           occasion: "Smart casual",  category: "daily",   season_suitability: "Year-round" },
    ],
    style_rules: [
      "Both gold and silver work — match the outfit's colour temperature.",
      "Earth tones and muted cool tones both sit well in your palette.",
      "Avoid high-chroma or neon colours.",
    ],
    season_explanation: "Your colouring aligns with Soft Autumn — medium depth, muted, and balanced. Warm greige, sage, and dusty mauve define your palette.",
    materials: [
      { name: "Cotton",  finish: "matte",    note: "Matte basics in earth or dusty tones." },
      { name: "Linen",   finish: "matte",    note: "Natural texture for spring/summer." },
      { name: "Wool",    finish: "textured", note: "Textured wool in sage or greige for autumn." },
    ],
    accessories: [
      { type: "jewelry", value: "Gold or silver (match outfit)", note: "Neutral skin suits both metals." },
      { type: "shoes",   value: "Warm taupe or sand",            note: "Neutral-warm footwear grounds palette." },
    ],
  },

  // ── TYPE IV COOL ─────────────────────────────────────────────────────────────
  "IV_cool": {
    best_colors: [
      { name: "True White",    hex: "#FFFFFF", why: "High contrast against cool olive/brown skin.",       usage: "tops, dresses",        group: "neutrals"  },
      { name: "True Black",    hex: "#1A1A1A", why: "Maximum depth suits medium-dark cool skin.",         usage: "trousers, outerwear",  group: "neutrals"  },
      { name: "Fuchsia",       hex: "#C0208A", why: "Clear cool pink-magenta creates vivid contrast.",    usage: "statement tops",       group: "statement" },
      { name: "Royal Blue",    hex: "#2040B0", why: "Cool jewel blue flatters cool olive skin.",           usage: "blazers, dresses",     group: "statement" },
      { name: "Cool Emerald",  hex: "#007858", why: "Cool jewel green complements this skin depth.",      usage: "tops, statement",      group: "statement" },
      { name: "Icy Pink",      hex: "#F0D0E0", why: "Pale cool pink contrasts against medium-dark skin.", usage: "tops, accessories",    group: "accent"    },
      { name: "Burgundy",      hex: "#800030", why: "Deep cool red-wine suits medium-dark cool skin.",    usage: "outerwear, statement", group: "statement" },
      { name: "Navy",          hex: "#1A2060", why: "Deep cool dark anchors the palette.",                usage: "suits, trousers",      group: "neutrals"  },
      { name: "Cool Purple",   hex: "#6030A0", why: "Cool jewel purple adds dimension.",                  usage: "statement pieces",     group: "statement" },
      { name: "Silver",        hex: "#A8B0C0", why: "Cool metallic neutral bridges all looks.",           usage: "accessories",          group: "neutrals"  },
    ],
    avoid_colors: [
      { name: "Mustard",       hex: "#D4A800", reason: "Yellow-green creates sallow cast on cool skin.",  effect: "sallow, ill"      },
      { name: "Orange",        hex: "#E05020", reason: "Warm tone clashes with cool olive undertone.",    effect: "harsh, clashing"  },
      { name: "Warm Brown",    hex: "#8B5E3C", reason: "Golden brown fights cool undertone strongly.",    effect: "muddy, dull"      },
      { name: "Camel",         hex: "#C09858", reason: "Warm neutral pulls undertone in wrong direction.", effect: "discordant"       },
      { name: "Terracotta",    hex: "#C06848", reason: "Warm earth-orange incompatible with cool olive.", effect: "clashing"         },
    ],
    outfits: [
      { title: "Winter Power",  description: "Black blazer over white shirt and navy trousers.",             colors: ["#1A1A1A","#FFFFFF","#1A2060"],   occasion: "Office, formal",     category: "formal",  season_suitability: "Year-round"     },
      { title: "Jewel Evening", description: "Fuchsia dress with silver accessories and black heels.",       colors: ["#C0208A","#C0C0C0","#1A1A1A"],  occasion: "Evening, gala",      category: "party",   season_suitability: "Year-round"     },
      { title: "Cool Contrast", description: "Royal blue blazer over white tee, black jeans.",              colors: ["#2040B0","#FFFFFF","#1A1A1A"],   occasion: "Smart casual",       category: "casual",  season_suitability: "Year-round"     },
      { title: "Deep Jewel",    description: "Burgundy midi dress with navy heels and silver jewellery.",   colors: ["#800030","#1A2060","#C0C0C0"],   occasion: "Formal, dinner",     category: "formal",  season_suitability: "Autumn, Winter" },
      { title: "Vivid Cool",    description: "Cool emerald top with black trousers and silver accessories.", colors: ["#007858","#1A1A1A","#C0C0C0"],  occasion: "Office, smart",      category: "daily",   season_suitability: "Year-round"     },
    ],
    style_rules: [
      "Silver and white-gold metals only — yellow gold clashes with cool olive skin.",
      "True black and white create perfect high-contrast outfits for your depth.",
      "Jewel tones (fuchsia, royal blue, emerald, cool purple) are your strongest colours.",
      "Avoid all warm earth tones — they fight cool undertone and create muddy effect.",
      "Icy pastels work as accent against your depth, not as main colour.",
    ],
    season_explanation: "Your colouring aligns with True Winter — medium-dark depth, cool, and high contrast. Black, white, and jewel tones define your best palette.",
    materials: [
      { name: "Silk",        finish: "sheen",    note: "Jewel-tone silk maximises contrast for your depth." },
      { name: "Wool Crepe",  finish: "matte",    note: "Structured dark neutrals in matte finish." },
      { name: "Satin",       finish: "sheen",    note: "Evening sheen in cool jewel tones." },
    ],
    accessories: [
      { type: "jewelry", value: "Silver, white gold, platinum",    note: "Cool metals match cool olive/brown undertone." },
      { type: "shoes",   value: "Black, navy, or silver",          note: "Cool dark neutrals anchor looks." },
      { type: "bags",    value: "Black structured or jewel-toned", note: "High-contrast bags suit Winter palette." },
    ],
  },

  // ── TYPE IV WARM ─────────────────────────────────────────────────────────────
  "IV_warm": {
    best_colors: [
      { name: "Warm Brown",    hex: "#8B5E3C", why: "Warm deep brown echoes golden undertone.",           usage: "trousers, outerwear",  group: "neutrals"  },
      { name: "Rust",          hex: "#B04828", why: "Warm earthy red creates rich harmony.",              usage: "statement tops",       group: "statement" },
      { name: "Forest Green",  hex: "#386830", why: "Deep warm green suits rich warm olive skin.",        usage: "outerwear, tops",      group: "statement" },
      { name: "Camel",         hex: "#C8A060", why: "Golden-warm neutral echoes olive undertone.",        usage: "coats, blazers",       group: "neutrals"  },
      { name: "Warm Ivory",    hex: "#FFF3E0", why: "Warm creamy contrast to deep warm skin.",            usage: "tops, dresses",        group: "neutrals"  },
      { name: "Burnt Orange",  hex: "#CC5520", why: "Rich warm orange aligns deeply with warm olive.",    usage: "tops, statement",      group: "statement" },
      { name: "Olive",         hex: "#6A6A30", why: "Earthy yellow-green is a natural skin echo.",        usage: "trousers, outerwear",  group: "everyday"  },
      { name: "Cognac",        hex: "#A06030", why: "Warm cognac brown is a signature warm tone.",        usage: "accessories, shoes",   group: "neutrals"  },
      { name: "Spice",         hex: "#A84020", why: "Deep warm spice-red suits dark warm skin.",          usage: "statement pieces",     group: "statement" },
      { name: "Gold",          hex: "#C89020", why: "Warm gold metal and fabric suit olive warm skin.",   usage: "accessories, accents", group: "accent"    },
    ],
    avoid_colors: [
      { name: "Icy Pink",      hex: "#F0D8E8", reason: "Cool pale tone clashes with warm olive skin.",    effect: "discordant, cold"  },
      { name: "Lavender",      hex: "#C0A8D8", reason: "Cool violet fights warm undertone strongly.",     effect: "clashing, muddy"   },
      { name: "Cool Grey",     hex: "#9898B0", reason: "Blue-grey cast dulls warm olive complexion.",     effect: "dull, cold"        },
      { name: "Hot Pink",      hex: "#E0408A", reason: "Cool-pink clashes with warm golden skin.",        effect: "clashing"          },
      { name: "Silver White",  hex: "#F0F0F8", reason: "Cool white makes warm skin look sallow.",         effect: "sallow"            },
    ],
    outfits: [
      { title: "Warm Rich",     description: "Olive trousers, rust top, cognac leather boots.",            colors: ["#6A6A30","#B04828","#A06030"],  occasion: "Casual, weekend",    category: "casual",  season_suitability: "Autumn, Winter" },
      { title: "Earthy Power",  description: "Camel blazer over warm ivory shirt and warm brown trousers.",colors: ["#C8A060","#FFF3E0","#8B5E3C"],  occasion: "Office, smart",      category: "formal",  season_suitability: "Autumn, Winter" },
      { title: "Deep Warm",     description: "Forest green dress with gold accessories.",                  colors: ["#386830","#C89020"],            occasion: "Evening, events",    category: "party",   season_suitability: "Autumn, Winter" },
      { title: "Warm Vivid",    description: "Burnt orange top with olive trousers and cognac sandals.",   colors: ["#CC5520","#6A6A30","#A06030"],  occasion: "Casual, outings",    category: "summer",  season_suitability: "Autumn, Spring" },
    ],
    style_rules: [
      "Gold and bronze metals only — silver looks harsh against warm olive skin.",
      "Earth tones are your foundation: rust, camel, olive, warm brown.",
      "Burnt orange and spice are among your most powerful colours.",
      "Warm ivory is your white — pure white creates a cool clash.",
      "Layer warm tones together — monochromatic warm looks are extremely flattering.",
    ],
    season_explanation: "Your colouring aligns with Dark Autumn or Warm Autumn — medium-dark, warm, and rich. Earth tones, spice, and forest green form your ideal palette.",
    materials: [
      { name: "Suede",   finish: "textured", note: "Warm suede in rust or cognac is a signature material." },
      { name: "Linen",   finish: "matte",    note: "Earthy matte linen in olive or camel." },
      { name: "Leather", finish: "textured", note: "Warm leather in cognac or warm brown." },
      { name: "Wool",    finish: "textured", note: "Rich wool in spice, rust, or forest green." },
    ],
    accessories: [
      { type: "jewelry", value: "Gold, bronze, copper",           note: "Warm metals harmonise with warm olive skin." },
      { type: "shoes",   value: "Cognac, warm brown, rust",       note: "Earth-tone footwear stays cohesive." },
      { type: "bags",    value: "Tan leather or olive canvas",    note: "Warm neutral bags ground the palette." },
    ],
  },

  // ── TYPE IV NEUTRAL ──────────────────────────────────────────────────────────
  "IV_neutral": {
    best_colors: [
      { name: "Teal",          hex: "#3A8888", why: "Balanced teal flatters neutral olive/brown skin.",   usage: "tops, accessories",    group: "statement" },
      { name: "Warm Taupe",    hex: "#A09080", why: "Warm-neutral taupe bridges both undertone sides.",  usage: "trousers, basics",     group: "neutrals"  },
      { name: "Dusty Mauve",   hex: "#A07878", why: "Soft warm-cool pink flatters neutral medium skin.", usage: "tops, dresses",        group: "everyday"  },
      { name: "Olive",         hex: "#6A6A30", why: "Earthy olive suits neutral medium-dark skin.",      usage: "trousers, outerwear",  group: "everyday"  },
      { name: "Forest Green",  hex: "#387038", why: "Deep green flatters neutral warm-cool skin.",       usage: "outerwear, statement", group: "statement" },
      { name: "Caramel",       hex: "#C09050", why: "Warm-neutral caramel bridges undertone well.",      usage: "blazers, coats",       group: "neutrals"  },
      { name: "Deep Burgundy", hex: "#780030", why: "Rich dark tone adds depth to neutral medium skin.", usage: "statement, outerwear", group: "statement" },
    ],
    avoid_colors: [
      { name: "Pale Pastels",  hex: "#F0E0F0", reason: "Too light — disappears against medium skin.",    effect: "washed out"    },
      { name: "Neon Orange",   hex: "#FF5500", reason: "Too harsh for neutral medium depth.",             effect: "overwhelming"  },
      { name: "Icy Blue",      hex: "#C8E4F8", reason: "Too cool and light for neutral warm-ish skin.",  effect: "discordant"    },
    ],
    outfits: [
      { title: "Neutral Earth",  description: "Olive trousers, warm taupe blouse, teal scarf.",    colors: ["#6A6A30","#A09080","#3A8888"], occasion: "Casual, office", category: "casual",  season_suitability: "Autumn, Spring" },
      { title: "Deep Neutral",   description: "Deep burgundy dress with caramel belt and shoes.",  colors: ["#780030","#C09050"],           occasion: "Evening",       category: "party",   season_suitability: "Autumn, Winter" },
    ],
    style_rules: [
      "Both gold and silver work — choose based on outfit warmth.",
      "Rich, saturated tones flatter more than pale or muted ones at your depth.",
      "Olive and forest green are reliable anchors.",
    ],
    season_explanation: "Your colouring aligns with True Autumn — medium-dark, balanced, and rich. Earth tones and jewel-adjacent hues define your palette.",
    materials: [
      { name: "Cotton", finish: "matte",    note: "Matte basics in earthy or cool tones." },
      { name: "Linen",  finish: "matte",    note: "Natural texture for warm months." },
      { name: "Wool",   finish: "textured", note: "Rich textured wool for cooler months." },
    ],
    accessories: [
      { type: "jewelry", value: "Gold or silver (match outfit)",  note: "Both work for neutral undertone." },
      { type: "shoes",   value: "Warm taupe or dark teal",        note: "Neutral-rich footwear stays cohesive." },
    ],
  },

  // ── TYPE V COOL ──────────────────────────────────────────────────────────────
  "V_cool": {
    best_colors: [
      { name: "Pure White",    hex: "#FFFFFF", why: "Vivid contrast flatters deep cool skin beautifully.",  usage: "tops, dresses",        group: "neutrals"  },
      { name: "Icy Pink",      hex: "#F0D0E0", why: "Pale cool pink pops strongly against deep skin.",      usage: "tops, accessories",    group: "accent"    },
      { name: "Royal Blue",    hex: "#2040B0", why: "Clear cool jewel blue — maximum saturation suits depth.", usage: "statement tops",     group: "statement" },
      { name: "Fuchsia",       hex: "#C0208A", why: "Vivid cool pink-magenta creates stunning contrast.",   usage: "statement pieces",     group: "statement" },
      { name: "Icy Lavender",  hex: "#D8D0F0", why: "Pale cool violet provides high contrast.",             usage: "tops, accessories",    group: "accent"    },
      { name: "Emerald",       hex: "#007850", why: "Cool jewel green rich enough for deep skin.",          usage: "statement tops",       group: "statement" },
      { name: "Deep Burgundy", hex: "#780030", why: "Rich cool dark red adds dimension to deep skin.",      usage: "outerwear, statement", group: "statement" },
      { name: "True Black",    hex: "#1A1A1A", why: "Near-skin depth creates elegant monochromatic.",       usage: "all dark pieces",      group: "neutrals"  },
      { name: "Silver",        hex: "#A8B0C0", why: "Cool metallic contrasts beautifully against deep skin.",usage: "accessories",         group: "neutrals"  },
      { name: "Cobalt",        hex: "#1848C0", why: "Saturated cool blue is vivid against deep skin.",      usage: "tops, statement",      group: "statement" },
    ],
    avoid_colors: [
      { name: "Mustard",       hex: "#D4A800", reason: "Yellow-green creates ashy, sallow effect.",         effect: "ashy, sallow"     },
      { name: "Camel",         hex: "#C09858", reason: "Warm beige too close to skin depth — blends in.",   effect: "muddy, bland"     },
      { name: "Orange",        hex: "#E05020", reason: "Warm-orange clashes with cool undertone.",          effect: "clashing, harsh"  },
      { name: "Warm Brown",    hex: "#8B5E3C", reason: "Too similar in depth to deep skin, warm cast.",     effect: "muddy"            },
      { name: "Muted Taupe",   hex: "#B0A898", reason: "Greyed muted tone dulls deep cool complexion.",     effect: "dull, flat"       },
    ],
    outfits: [
      { title: "Deep Contrast", description: "White structured blazer over black trousers.",               colors: ["#FFFFFF","#1A1A1A"],            occasion: "Office, formal",     category: "formal",  season_suitability: "Year-round"     },
      { title: "Jewel Power",   description: "Fuchsia dress with silver accessories.",                     colors: ["#C0208A","#C0C0C0"],            occasion: "Evening, events",    category: "party",   season_suitability: "Year-round"     },
      { title: "Cool Vivid",    description: "Royal blue top with white wide-leg trousers.",              colors: ["#2040B0","#FFFFFF"],             occasion: "Smart casual",       category: "daily",   season_suitability: "Year-round"     },
      { title: "Icy Contrast",  description: "Icy lavender blouse with true black trousers.",             colors: ["#D8D0F0","#1A1A1A"],            occasion: "Office, casual",     category: "minimal", season_suitability: "Year-round"     },
      { title: "Deep Jewel",    description: "Emerald midi dress with silver jewellery and black heels.", colors: ["#007850","#C0C0C0","#1A1A1A"], occasion: "Formal, dinner",      category: "formal",  season_suitability: "Year-round"     },
    ],
    style_rules: [
      "White near the face gives maximum flattering contrast for deep cool skin.",
      "Silver and cool-metallic accessories — gold looks warm and discordant.",
      "Jewel tones at full saturation — fuchsia, cobalt, emerald — are your best brights.",
      "Avoid muted or greyed-down colours — your depth needs saturation.",
      "Pure black can work as a monochromatic choice; don't shy away from it.",
      "Icy pastels (icy pink, icy lavender) give beautiful high contrast as accent.",
    ],
    season_explanation: "Your colouring aligns with Deep Winter or True Winter — deep, cool, and vivid. White, jewel tones, and high contrast define your most powerful palette.",
    materials: [
      { name: "Silk",        finish: "sheen",    note: "Jewel-tone silk shows maximum saturation on deep skin." },
      { name: "Satin",       finish: "sheen",    note: "Evening sheen in vivid cool tones." },
      { name: "Crisp Cotton",finish: "matte",    note: "Structured white cotton creates ideal contrast." },
    ],
    accessories: [
      { type: "jewelry",   value: "Silver, white gold, platinum",       note: "Cool metals flatter deep cool skin." },
      { type: "shoes",     value: "Black, white, or silver",            note: "High-contrast or cool neutrals." },
      { type: "bags",      value: "White structured or jewel-toned",    note: "Bold contrast bags suit this depth." },
    ],
  },

  // ── TYPE V WARM ──────────────────────────────────────────────────────────────
  "V_warm": {
    best_colors: [
      { name: "Warm Ivory",    hex: "#FFF3E0", why: "Creamy warm white contrasts beautifully.",            usage: "tops, dresses",        group: "neutrals"  },
      { name: "Rust",          hex: "#A84020", why: "Rich warm rust aligns with deep warm skin.",          usage: "statement tops",       group: "statement" },
      { name: "Burnt Orange",  hex: "#CC5020", why: "Warm orange-red harmonises with warm deep skin.",     usage: "statement pieces",     group: "statement" },
      { name: "Forest Green",  hex: "#2A5820", why: "Deep warm green creates rich contrast.",              usage: "outerwear, dresses",   group: "statement" },
      { name: "Cognac",        hex: "#A05828", why: "Warm rich brown in the skin's warm family.",          usage: "accessories, shoes",   group: "neutrals"  },
      { name: "Spice",         hex: "#983818", why: "Deep warm spice-red suits deep warm complexion.",     usage: "outerwear, statement", group: "statement" },
      { name: "Warm Gold",     hex: "#C08818", why: "Golden warm tone richly complements warm deep skin.", usage: "accessories, accents", group: "accent"    },
      { name: "Warm Brown",    hex: "#7A4828", why: "Warm earthy brown echoes undertone.",                 usage: "trousers, outerwear",  group: "neutrals"  },
      { name: "Olive",         hex: "#5A5A28", why: "Earthy warm tone suits deep warm complexion.",        usage: "trousers, outerwear",  group: "everyday"  },
      { name: "Tomato Red",    hex: "#C82818", why: "Clear warm red flatters deeply.",                     usage: "statement tops",       group: "statement" },
    ],
    avoid_colors: [
      { name: "Icy Blue",      hex: "#C8E4F8", reason: "Cold tone clashes with deep warm skin.",           effect: "cold, discordant"  },
      { name: "Cool Lavender", hex: "#C0A8D8", reason: "Cool purple fights warm undertone.",               effect: "clashing, muddy"   },
      { name: "Silver Grey",   hex: "#9898B0", reason: "Cool grey dulls warm deep complexion.",            effect: "ashy, cold"        },
      { name: "Pastel Yellow", hex: "#FFFFF0", reason: "Too pale — disappears against deep warm skin.",    effect: "washed out"        },
      { name: "Pale Pink",     hex: "#F0C8C8", reason: "Too light and cool for deep warm skin.",           effect: "washed out, cold"  },
    ],
    outfits: [
      { title: "Deep Earth",    description: "Rust dress with warm gold belt and cognac heels.",            colors: ["#A84020","#C08818","#A05828"], occasion: "Formal, evening",    category: "party",   season_suitability: "Autumn, Winter" },
      { title: "Warm Power",    description: "Forest green blazer over warm ivory shirt and olive trousers.", colors: ["#2A5820","#FFF3E0","#5A5A28"], occasion: "Office, smart",    category: "formal",  season_suitability: "Autumn, Winter" },
      { title: "Rich Casual",   description: "Burnt orange top with warm brown wide-leg trousers.",         colors: ["#CC5020","#7A4828"],            occasion: "Casual, weekend",    category: "casual",  season_suitability: "Autumn, Spring" },
      { title: "Warm Evening",  description: "Spice midi dress with gold jewellery and cognac heels.",      colors: ["#983818","#C08818","#A05828"], occasion: "Evening, dinner",    category: "party",   season_suitability: "Year-round"     },
    ],
    style_rules: [
      "Gold and bronze metals only — silver looks cold against deep warm skin.",
      "Rich saturated warm tones are your power palette — never dilute with pastels.",
      "Warm ivory gives better contrast than pure white.",
      "Rust, burnt orange, and spice are your signature statement colours.",
      "Avoid all cool or icy tones — they fight the warmth and look discordant.",
      "Monochromatic warm looks (all-rust, all-caramel) are extremely effective.",
    ],
    season_explanation: "Your colouring aligns with Deep Autumn — deep, warm, and intensely rich. Earth tones, rust, and forest green at full depth define your most powerful palette.",
    materials: [
      { name: "Suede",   finish: "textured", note: "Deep warm suede in rust or cognac." },
      { name: "Silk",    finish: "sheen",    note: "Warm-toned silk in spice or gold for evenings." },
      { name: "Leather", finish: "textured", note: "Warm leather in cognac or warm brown." },
      { name: "Wool",    finish: "textured", note: "Rich wool in deep earthy tones." },
    ],
    accessories: [
      { type: "jewelry",   value: "Gold, bronze, copper",           note: "Warm metals harmonise with deep warm skin." },
      { type: "shoes",     value: "Cognac, warm brown, rust",       note: "Deep warm footwear anchors the look." },
      { type: "bags",      value: "Warm leather or suede",          note: "Rich warm-tone bags complete the palette." },
    ],
  },

  // ── TYPE V NEUTRAL ───────────────────────────────────────────────────────────
  "V_neutral": {
    best_colors: [
      { name: "Pure White",    hex: "#FFFFFF", why: "Strong contrast flatters deep skin.",                usage: "tops, dresses",       group: "neutrals"  },
      { name: "Teal",          hex: "#208880", why: "Rich balanced teal flatters deep neutral skin.",     usage: "tops, statement",     group: "statement" },
      { name: "Deep Burgundy", hex: "#780030", why: "Rich dark tone suits deep skin depth.",              usage: "statement, outerwear",group: "statement" },
      { name: "Forest Green",  hex: "#306830", why: "Deep green works across warm and cool.",             usage: "outerwear, dresses",  group: "statement" },
      { name: "Warm Brown",    hex: "#7A4828", why: "Earthy depth echoes skin tone warmly.",              usage: "trousers, outerwear", group: "neutrals"  },
      { name: "Cobalt",        hex: "#1848C0", why: "Vivid cool blue creates high contrast.",             usage: "statement pieces",    group: "statement" },
      { name: "Warm Ivory",    hex: "#FFF3E0", why: "Warm cream also works as contrast.",                 usage: "tops, basics",        group: "neutrals"  },
    ],
    avoid_colors: [
      { name: "Muted Beige",   hex: "#C8B8A0", reason: "Too close to skin — no contrast, looks muddy.",  effect: "muddy, flat"   },
      { name: "Pastel Pink",   hex: "#F0C8C8", reason: "Too light — disappears against deep skin.",       effect: "washed out"    },
      { name: "Pale Yellow",   hex: "#FFFFF0", reason: "Too light and cool — no visual interest.",        effect: "flat"          },
    ],
    outfits: [
      { title: "Bold Neutral",  description: "Teal dress with warm brown belt and white sandals.",   colors: ["#208880","#7A4828","#FFFFFF"], occasion: "Casual, events", category: "casual",  season_suitability: "Year-round" },
      { title: "Deep Contrast", description: "White blazer, deep burgundy trousers, gold earrings.", colors: ["#FFFFFF","#780030"],           occasion: "Office",        category: "formal",  season_suitability: "Year-round" },
    ],
    style_rules: [
      "High contrast (white near face) is your most flattering move.",
      "Rich, saturated colours at full depth — no muted or pale versions.",
      "Both gold and silver work depending on outfit warmth.",
    ],
    season_explanation: "Your colouring aligns with Deep season — dark, rich, and strong. High contrast and saturated tones define your palette.",
    materials: [
      { name: "Silk",    finish: "sheen",    note: "Rich sheen in saturated tones." },
      { name: "Cotton",  finish: "matte",    note: "Crisp white cotton for day contrast." },
      { name: "Wool",    finish: "textured", note: "Rich textured wool in deep tones." },
    ],
    accessories: [
      { type: "jewelry", value: "Gold or silver (match outfit)", note: "Neutral deep skin suits both metals." },
      { type: "shoes",   value: "White, black, or warm brown",   note: "Strong contrast or warm neutral." },
    ],
  },

  // ── TYPE VI COOL ─────────────────────────────────────────────────────────────
  "VI_cool": {
    best_colors: [
      { name: "Pure White",    hex: "#FFFFFF", why: "Strongest contrast — hallmark of deep cool skin.",    usage: "tops, dresses",        group: "neutrals"  },
      { name: "Fuchsia",       hex: "#C0208A", why: "Vivid cool magenta-pink creates stunning contrast.",  usage: "statement tops",       group: "statement" },
      { name: "Cobalt Blue",   hex: "#1040C0", why: "Pure cool blue is brilliant against deepest skin.",   usage: "statement pieces",     group: "statement" },
      { name: "Bright Coral",  hex: "#FF4040", why: "Clear high-chroma coral — cooler than orange.",       usage: "statement tops",       group: "statement" },
      { name: "Icy Lavender",  hex: "#D8D0F0", why: "Pale cool violet makes high contrast pop.",           usage: "tops, accessories",    group: "accent"    },
      { name: "Emerald",       hex: "#007850", why: "Vivid cool jewel green flatters deepest cool skin.",  usage: "dresses, blazers",     group: "statement" },
      { name: "Icy Pink",      hex: "#F0D0E0", why: "Pale cool pink — very high contrast against depth.",  usage: "tops, accessories",    group: "accent"    },
      { name: "Cool Red",      hex: "#CC1010", why: "Pure cool red at maximum contrast.",                  usage: "statement pieces",     group: "statement" },
      { name: "True Black",    hex: "#101010", why: "Deepest dark — monochromatic depth option.",          usage: "all dark pieces",      group: "neutrals"  },
      { name: "Silver",        hex: "#A8B0C0", why: "Cool metallic shines beautifully on deepest skin.",   usage: "accessories",          group: "neutrals"  },
    ],
    avoid_colors: [
      { name: "Mustard",       hex: "#D4A800", reason: "Warm yellow creates ashy, dull effect.",           effect: "ashy, dull"        },
      { name: "Brown Nude",    hex: "#A07050", reason: "Too close to skin colour — no contrast.",          effect: "muddy, invisible"  },
      { name: "Warm Orange",   hex: "#E06020", reason: "Warm-orange clashes with cool undertone.",         effect: "clashing"          },
      { name: "Warm Camel",    hex: "#C8A060", reason: "Too warm, too close to skin — double clash.",      effect: "muddy, discordant" },
      { name: "Olive",         hex: "#7A7A38", reason: "Warm yellow-green fights cool deep skin.",         effect: "ashy, dull"        },
      { name: "Muted Taupe",   hex: "#B0A898", reason: "No contrast, warm cast — completely wrong.",       effect: "flat, discordant"  },
    ],
    outfits: [
      { title: "Maximum Contrast",  description: "White wide-leg trousers with cobalt blue blazer.",       colors: ["#FFFFFF","#1040C0"],            occasion: "Office, events",     category: "formal",  season_suitability: "Year-round"     },
      { title: "Vivid Cool",        description: "Fuchsia dress with silver accessories.",                 colors: ["#C0208A","#C0C0C0"],            occasion: "Evening, gala",      category: "party",   season_suitability: "Year-round"     },
      { title: "Jewel Statement",   description: "Emerald blazer over white shirt and black trousers.",   colors: ["#007850","#FFFFFF","#101010"],  occasion: "Smart casual, office",category: "daily",  season_suitability: "Year-round"     },
      { title: "Icy Contrast",      description: "Icy pink top with true black wide-leg trousers.",       colors: ["#F0D0E0","#101010"],            occasion: "Casual, brunch",     category: "minimal", season_suitability: "Year-round"     },
      { title: "Monochrome Depth",  description: "All-black outfit with silver jewellery and white shoes.",colors: ["#101010","#C0C0C0","#FFFFFF"], occasion: "Any occasion",        category: "formal",  season_suitability: "Year-round"     },
      { title: "Power Red",         description: "Cool red dress with black strappy heels and silver bag.",colors: ["#CC1010","#101010","#C0C0C0"], occasion: "Evening, dinner",    category: "party",   season_suitability: "Year-round"     },
    ],
    style_rules: [
      "Pure white near the face is your single most flattering contrast choice.",
      "Silver, platinum, and white gold only — yellow gold looks warm and discordant.",
      "Vivid saturated cool colours are your signature — never dilute with muted versions.",
      "Never wear brown, camel, or nude tones — they create a muddy, contrast-free look.",
      "All-black is a valid monochromatic option — pair with bright accessories for contrast.",
      "Icy pastels (icy pink, icy lavender) create beautiful high contrast as accents.",
      "Bright coral (not orange) works because of its blue-cool base.",
    ],
    season_explanation: "Your colouring aligns with True Winter — deepest skin depth, cool undertone, maximum contrast. White, vivid cool jewel tones, and silver define your power palette.",
    materials: [
      { name: "Silk",         finish: "sheen",    note: "Vivid jewel-tone silk maximises colour impact." },
      { name: "Satin",        finish: "sheen",    note: "Cool sheen for evening — fuchsia or cobalt." },
      { name: "Crisp Cotton", finish: "matte",    note: "Stark white crisp cotton for maximum contrast." },
      { name: "Wool Crepe",   finish: "matte",    note: "Structured black for monochromatic depth looks." },
    ],
    accessories: [
      { type: "jewelry",   value: "Silver, white gold, platinum",      note: "Cool metals are essential at this undertone." },
      { type: "shoes",     value: "White, black, silver, or cobalt",   note: "High contrast or cool jewel footwear." },
      { type: "bags",      value: "White or jewel-toned structured",   note: "Bold contrast bags complete the look." },
    ],
  },

  // ── TYPE VI WARM ─────────────────────────────────────────────────────────────
  "VI_warm": {
    best_colors: [
      { name: "Warm Ivory",    hex: "#FFF3E0", why: "Warm cream contrast on deepest warm skin.",           usage: "tops, dresses",        group: "neutrals"  },
      { name: "Bright Orange", hex: "#E05018", why: "Vivid warm orange — signature colour for warm deep.", usage: "statement tops",       group: "statement" },
      { name: "Warm Red",      hex: "#C01818", why: "Clear warm red creates rich high contrast.",          usage: "statement pieces",     group: "statement" },
      { name: "Warm Gold",     hex: "#C08010", why: "Deep gold flatters deepest warm skin strongly.",      usage: "accessories, accents", group: "accent"    },
      { name: "Forest Green",  hex: "#205020", why: "Deep earthy green contrasts beautifully.",            usage: "outerwear, dresses",   group: "statement" },
      { name: "Rich Brown",    hex: "#5A3010", why: "Deep warm brown — monochromatic depth option.",       usage: "trousers, outerwear",  group: "neutrals"  },
      { name: "Burnt Sienna",  hex: "#A03818", why: "Earthy warm red-brown echoes undertone richly.",      usage: "tops, statement",      group: "statement" },
      { name: "Saffron",       hex: "#E09020", why: "Warm golden-yellow pops on deep warm skin.",          usage: "statement tops",       group: "statement" },
      { name: "Copper",        hex: "#A85020", why: "Warm copper-brown metallic complements deeply.",      usage: "accessories",          group: "accent"    },
      { name: "Olive",         hex: "#5A5820", why: "Warm earthy olive grounds the palette.",              usage: "trousers, outerwear",  group: "everyday"  },
    ],
    avoid_colors: [
      { name: "Icy Blue",      hex: "#C8E4F8", reason: "Stark cold contrast clashes with warm deep skin.", effect: "harsh, cold"       },
      { name: "Cool Lavender", hex: "#C0A8D8", reason: "Cool violet strongly clashes with warm undertone.",effect: "clashing, muddy"   },
      { name: "Silver",        hex: "#A8B0C0", reason: "Cool metallic looks discordant on warm deep skin.",effect: "cold, discordant"  },
      { name: "Pale Pink",     hex: "#F0C8C8", reason: "Too light/cool — no contrast, wrong temperature.", effect: "flat, cold"        },
      { name: "Pastel Mint",   hex: "#C8F0E0", reason: "Cool light tone clashes at both dimensions.",      effect: "discordant, flat"  },
    ],
    outfits: [
      { title: "Deep Warm Power",  description: "Burnt sienna blazer over warm ivory shirt and olive trousers.", colors: ["#A03818","#FFF3E0","#5A5820"], occasion: "Office, smart",      category: "formal",  season_suitability: "Autumn, Winter" },
      { title: "Warm Vivid",       description: "Bright orange dress with warm gold jewellery.",               colors: ["#E05018","#C08010"],            occasion: "Formal, evening",    category: "party",   season_suitability: "Year-round"     },
      { title: "Earth Monochrome", description: "All-brown look: rich brown trousers, burnt sienna top.",      colors: ["#5A3010","#A03818"],            occasion: "Casual, smart",      category: "minimal", season_suitability: "Autumn, Winter" },
      { title: "Golden Contrast",  description: "Saffron top with forest green wide-leg trousers.",           colors: ["#E09020","#205020"],            occasion: "Casual, weekends",   category: "casual",  season_suitability: "Autumn, Spring" },
      { title: "Warm Deep",        description: "Warm red midi dress with copper accessories.",                colors: ["#C01818","#A85020"],            occasion: "Evening, dinner",    category: "party",   season_suitability: "Year-round"     },
    ],
    style_rules: [
      "Gold and copper metals only — silver looks harsh and cold against deep warm skin.",
      "Warm ivory gives beautiful contrast; pure white looks cold.",
      "Rich, fully saturated warm tones — never dilute with muted or cool versions.",
      "Avoid all cool or icy tones; they create discordant contrast.",
      "All-brown monochromatic looks are uniquely flattering at this depth.",
      "Saffron, bright orange, and warm red are your signature bold colours.",
    ],
    season_explanation: "Your colouring aligns with Deep Autumn — deepest warm skin, richly warm, and intensely vibrant. Earth tones, warm reds, and golden hues at maximum saturation define your palette.",
    materials: [
      { name: "Silk",    finish: "sheen",    note: "Warm-toned silk in orange or gold for evenings." },
      { name: "Suede",   finish: "textured", note: "Deep warm suede in cognac or burnt brown." },
      { name: "Leather", finish: "textured", note: "Rich warm leather in brown or copper." },
      { name: "Wool",    finish: "textured", note: "Deep earthy wool for cooler seasons." },
    ],
    accessories: [
      { type: "jewelry",   value: "Gold, copper, bronze",             note: "Warm metals are essential for this undertone." },
      { type: "shoes",     value: "Warm brown, cognac, copper",       note: "Deep warm footwear anchors the palette." },
      { type: "bags",      value: "Rich warm leather or olive canvas",note: "Earthy warm bags complete the look." },
    ],
  },

  // ── TYPE VI NEUTRAL ──────────────────────────────────────────────────────────
  "VI_neutral": {
    best_colors: [
      { name: "Pure White",    hex: "#FFFFFF", why: "Maximum contrast on deepest skin.",                  usage: "tops, dresses",       group: "neutrals"  },
      { name: "Teal",          hex: "#108880", why: "Rich balanced teal flatters deep neutral skin.",    usage: "statement tops",      group: "statement" },
      { name: "Warm Red",      hex: "#C01818", why: "Vivid red at full saturation.",                     usage: "statement pieces",    group: "statement" },
      { name: "Cobalt Blue",   hex: "#1040C0", why: "Vivid cool blue — high contrast.",                  usage: "statement pieces",    group: "statement" },
      { name: "Forest Green",  hex: "#205020", why: "Deep green works across warm and cool.",            usage: "outerwear, dresses",  group: "statement" },
      { name: "Warm Ivory",    hex: "#FFF3E0", why: "Warm cream also works as contrast.",               usage: "tops, basics",        group: "neutrals"  },
      { name: "Saffron",       hex: "#E09020", why: "Bold warm-yellow pops on deepest skin.",           usage: "statement tops",      group: "statement" },
      { name: "Fuchsia",       hex: "#C0208A", why: "Vivid cool pink-magenta creates contrast.",        usage: "statement pieces",    group: "statement" },
    ],
    avoid_colors: [
      { name: "Muted Beige",   hex: "#C8B8A0", reason: "No contrast, warm cast — looks muddy.",         effect: "muddy, flat"   },
      { name: "Pastel Any",    hex: "#F0E8E0", reason: "Pastels disappear against deep skin.",          effect: "washed out"    },
      { name: "Brown Nude",    hex: "#A07050", reason: "Too close to skin — no contrast.",              effect: "invisible"     },
    ],
    outfits: [
      { title: "Maximum Contrast",  description: "White blazer, cobalt blue dress.",                     colors: ["#FFFFFF","#1040C0"],           occasion: "Formal, events", category: "formal",  season_suitability: "Year-round" },
      { title: "Warm Vivid",        description: "Saffron top with forest green trousers, gold jewellery.", colors: ["#E09020","#205020","#C08010"], occasion: "Casual",         category: "casual",  season_suitability: "Year-round" },
      { title: "Bold Neutral",      description: "Teal dress with warm ivory accessories.",              colors: ["#108880","#FFF3E0"],           occasion: "Smart casual",   category: "daily",   season_suitability: "Year-round" },
    ],
    style_rules: [
      "High contrast is essential — white or vivid colours near the face always.",
      "Rich saturated colours only — never muted, pastel, or nude-adjacent tones.",
      "Both gold and silver work depending on outfit temperature.",
      "Avoid any colour close to your skin depth — zero contrast looks invisible.",
    ],
    season_explanation: "Your colouring aligns with Deep season — deepest depth, maximum contrast. Vivid saturated colours and pure white define your palette.",
    materials: [
      { name: "Silk",    finish: "sheen",    note: "Vivid-tone silk maximises impact." },
      { name: "Cotton",  finish: "matte",    note: "Crisp white cotton for contrast basics." },
      { name: "Suede",   finish: "textured", note: "Deep earthy suede for warm accent pieces." },
    ],
    accessories: [
      { type: "jewelry", value: "Gold or silver (match outfit)", note: "Deep neutral skin suits both metals." },
      { type: "shoes",   value: "White, black, or jewel-toned", note: "Strong contrast or rich colour." },
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rgbToHex(rgb: number[]): string {
  return "#" + rgb.slice(0, 3)
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("");
}

function resolveKey(type: FitzpatrickType, undertone: string): string {
  const u = undertone.toLowerCase();
  const key = `${type}_${u}`;
  if (P[key]) return key;
  // fallback: neutral
  const neutral = `${type}_neutral`;
  if (P[neutral]) return neutral;
  return "III_neutral";
}

function toneDescription(type: FitzpatrickType): string {
  const map: Record<FitzpatrickType, string> = {
    I:   "Very pale skin — Fitzpatrick Type I",
    II:  "Fair skin — Fitzpatrick Type II",
    III: "Light-medium skin — Fitzpatrick Type III",
    IV:  "Olive/moderate brown skin — Fitzpatrick Type IV",
    V:   "Dark brown skin — Fitzpatrick Type V",
    VI:  "Deepest brown/black skin — Fitzpatrick Type VI",
  };
  return map[type];
}

function undertoneNotes(undertone: string): string {
  const u = undertone.toLowerCase();
  if (u === "warm") return "Warm undertones suit earthy, golden, and orange-adjacent colour families.";
  if (u === "cool") return "Cool undertones suit jewel tones, blue-based neutrals, and true whites.";
  return "Neutral undertones work with both warm and cool colour families; muted tones are especially flattering.";
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function getRecommendation(profile: SkinProfile): RecommendationResult {
  const type = profile.fitzpatrick_type;
  const undertone = profile.undertone || "neutral";
  const hex = profile.hex || rgbToHex(profile.rgb || [128, 128, 128]);
  const key = resolveKey(type, undertone);
  const data = P[key];

  const season = (() => {
    const seasonMap: Record<string, string> = {
      "I_cool": "Clear Winter", "I_warm": "Light Spring", "I_neutral": "Soft Summer",
      "II_cool": "True Summer", "II_warm": "Warm Spring", "II_neutral": "Soft Summer",
      "III_cool": "Soft Summer", "III_warm": "Warm Autumn", "III_neutral": "Soft Autumn",
      "IV_cool": "True Winter", "IV_warm": "Dark Autumn", "IV_neutral": "True Autumn",
      "V_cool": "Deep Winter", "V_warm": "Deep Autumn", "V_neutral": "Deep Winter",
      "VI_cool": "True Winter", "VI_warm": "Deep Autumn", "VI_neutral": "Deep Winter",
    };
    return seasonMap[key] || "Autumn";
  })();

  const SKIN_DEPTH: Record<string, string> = {
    I: "Very Fair",
    II: "Fair",
    III: "Medium",
    IV: "Olive",
    V: "Brown",
    VI: "Deep",
  };
  const u = undertone.toLowerCase();
  const skinDescription = `${SKIN_DEPTH[type] || "Medium"} ${u.charAt(0).toUpperCase() + u.slice(1)} Skin`;

  const signatureColors = data.best_colors.slice(0, 3).map(c => ({
    name: c.name,
    hex: c.hex,
    reason: c.why || "Makes your complexion appear brighter"
  }));

  const nextSteps = data.style_rules.slice(0, 3);
  
  const confidenceReason: ConfidenceReason = {
    undertone: "high",
    contrast: "medium",
    brightness: "high",
    facial_harmony: "high"
  };

  return {
    profile: {
      detected_season: season,
      tone_description: toneDescription(type),
      undertone_notes: undertoneNotes(undertone),
      hex_derived: hex,
    },
    best_colors:        data.best_colors,
    avoid_colors:       data.avoid_colors,
    outfits:            data.outfits,
    style_rules:        data.style_rules,
    season_explanation: data.season_explanation,
    materials:          data.materials,
    accessories:        data.accessories,
    confidence: {
      score: 0.95,
      explanation: "Offline rule engine — Fitzpatrick type matched to curated colour palette.",
    },
    confidence_reason: confidenceReason,
    signature_colors: signatureColors,
    skin_description: skinDescription,
    next_steps: nextSteps,
  };
}

// Keep async signature for call-site compatibility
export async function getRecommendationAsync(profile: SkinProfile): Promise<RecommendationResult> {
  return getRecommendation(profile);
}
