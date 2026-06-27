# Product Requirement Document (PRD)
## Product: Color & Style Analyzer — StyleSense (Men)

---

## 1. Problem Statement

Most men lack clarity on what suits them in terms of colors and outfits. They:

- Buy clothes that don't match their skin tone
- Feel unsure about styling decisions
- Waste money on poor choices
- Have no simple tool for personalized fashion guidance

Existing solutions (blogs, influencers) are generic, not personalized.

> **There is a need for a simple, fast, and personalized tool that gives clear styling advice.**

---

## 2. Target Users

### Primary Users
- Men aged 16–35
- College students and early professionals
- Beginners in fashion
- Budget-conscious buyers who want to look better

### User Mindset
- "I don't know what looks good on me"
- "I want to improve but keep it simple"
- "Don't give me theory, just tell me what works"

---

## 3. Core User Flows

### Flow 1: First-Time User (Main Flow)
1. User lands on app
2. Sees simple CTA: **Upload your photo**
3. Uploads image
4. App processes image (or manual selection fallback)
5. User receives:
   - Skin tone category
   - Best colors
   - Colors to avoid
   - 2–3 outfit suggestions

> **Goal:** Get value within 30–60 seconds

### Flow 2: Manual Selection (Fallback Flow)
1. User skips photo upload
2. Selects:
   - Skin tone (light / medium / dark)
   - Undertone (warm / cool / neutral)
3. Gets same output as above

> **Important for MVP reliability**

### Flow 3: Repeat Usage
1. User returns
2. Uploads new photo or rechecks results
3. Uses recommendations while shopping or styling

---

## 4. Feature List

### MVP (Must Have)

#### Input
- Photo upload (basic)
- Manual skin tone + undertone selection

#### Processing (Simple Logic-Based)
- Map skin tone → predefined color palette
- No heavy AI in V1

#### Output
- Best colors (5–10)
- Colors to avoid (3–5)
- 2–3 simple outfit suggestions:
  - Example: "Black t-shirt + beige pants"
  - Example: "Olive shirt + blue jeans"

#### UI
- Clean, minimal interface
- Mobile-first design
- Fast loading

### Future Features (NOT in V1)
- AI face + undertone detection
- Outfit image generation
- "Upload outfit → get feedback"
- Mix & match wardrobe builder
- Occasion-based styling
- E-commerce integrations
- Social sharing

---

## 5. Edge Cases

### Image Issues
- Poor lighting → incorrect detection
- Multiple people in image
- Face not clearly visible

**Solution:** Show prompt — *"Upload a clear face photo in good lighting"*

### User Confusion
- Doesn't understand undertones

**Solution:** Simple helper text:
- *"Warm = yellow/golden skin"*
- *"Cool = pink/blue skin"*

### Incorrect Recommendations
- User feels suggestions don't match

**Solution:** Allow manual override of skin tone

### Device Constraints
- Low-end devices

**Solution:** Keep processing lightweight (no heavy AI in MVP)

---

## 6. Non-Goals

To keep V1 focused, do **NOT** include:

- No advanced AI or ML models
- No real-time outfit scanning
- No wardrobe tracking
- No shopping integrations
- No social/community features
- No deep personalization beyond color logic

> **Focus = Speed + Simplicity + Clarity**

---

## 7. Success Metrics

### Primary Metrics
- % of users completing analysis (Upload → Result)
- Time to result (< 60 seconds)
- User retention (returns within 7 days)

### Secondary Metrics
- Engagement with results (scroll, clicks)
- Manual vs photo usage ratio
- Conversion to paid (if enabled)

### Qualitative Signals
- "This actually helped me choose clothes"
- "Simple and useful"
- "I understand what suits me now"

---

## 8. Key Product Principles

| Principle | Description |
|---|---|
| Clarity over complexity | No jargon |
| Fast results | Instant value |
| Actionable output | Tell users exactly what to wear |
| Low friction | Minimal steps |

---

*PRD Version: 1.0 | Product: StyleSense MVP | March 2026*
