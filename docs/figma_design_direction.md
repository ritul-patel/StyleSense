# UX Design Specification — StyleSense
## Color & Style Analyzer (Men)

---

## 1. Screen List (V1 Scope)

| # | Screen |
|---|---|
| 1 | Landing / Home Screen |
| 2 | Upload Photo Screen |
| 3 | Manual Selection Screen |
| 4 | Processing Screen |
| 5 | Results Screen |
| 6 | Error / Retry States (global) |

---

## 2. Screen-by-Screen Breakdown

---

### Screen 1 — Landing / Home Screen

**Goal:** Get user to start within 3–5 seconds.

#### Layout Hierarchy
```
[Header]
  App Name: "StyleSense"

[Hero Section]
  Headline
  Subtext

[Primary CTA]
  Upload Photo

[Secondary CTA]
  Try Without Photo

[Footer]
  Minimal (optional)
```

#### Content
- **Headline:** *"Find what colors and outfits suit you"*
- **Subtext:** *"Upload your photo and get instant styling advice"*

#### Components
- Primary Button: `Upload Photo`
- Secondary Text Button: `Try manually`

#### Interaction Logic
| Action | Outcome |
|---|---|
| Click "Upload Photo" | → Upload Screen |
| Click "Try manually" | → Manual Selection Screen |

#### States
- **Empty State:** Not applicable
- **Error State:** Not applicable

---

### Screen 2 — Upload Photo Screen

**Goal:** Make uploading simple and clear.

#### Layout Hierarchy
```
[Back Button]

[Title]
  Upload your photo

[Upload Box]
  Drag & Drop / Tap to upload

[Preview Area]

[Helper Text]
  Photo tips

[CTA Button]
  Continue
```

#### Components
- File uploader (image only)
- Image preview
- Helper text:
  - *"Use clear lighting"*
  - *"Face should be visible"*

#### Interaction Logic
| Action | Outcome |
|---|---|
| Upload image | Show preview |
| After upload | Enable Continue button |
| Click Continue | → Processing Screen |

#### States

| State | Behavior |
|---|---|
| Empty | "No image uploaded yet" — Continue disabled |
| Error: Invalid file type | "Please upload an image" |
| Error: File too large | "Image too large" |
| Warning: Poor image | "Face not clear, results may be inaccurate" |

---

### Screen 3 — Manual Selection Screen

**Goal:** Provide reliable fallback with zero confusion.

#### Layout Hierarchy
```
[Back Button]

[Title]
  Select your details

[Section: Skin Tone]
  Options: Light | Medium | Dark

[Section: Undertone]
  Options: Warm | Cool | Neutral

[Helper Text]

[CTA Button]
  Get Results
```

#### Components
- Toggle buttons / cards for selections
- Helper tooltip:
  - *"Warm → yellow/golden"*
  - *"Cool → pink/blue"*

#### Interaction Logic
| Action | Outcome |
|---|---|
| Both fields selected | CTA enabled |
| Click "Get Results" | → Processing Screen |

#### States

| State | Behavior |
|---|---|
| Empty | No selection → CTA disabled |
| Error | "Please select both options" |

---

### Screen 4 — Processing Screen

**Goal:** Give feedback during processing (reduce drop-off).

#### Layout Hierarchy
```
[Centered Loader]

[Text]
  Analyzing your style...

[Subtext]
  This takes a few seconds
```

#### Components
- Spinner / progress indicator
- Minimal animation

#### Interaction Logic
| Action | Outcome |
|---|---|
| Processing complete | Auto-redirect to Results Screen |
| Timeout > 10s | Show retry prompt |

#### States

| State | Behavior |
|---|---|
| Error | "Something went wrong" + Retry button |

---

### Screen 5 — Results Screen *(Most Important)*

**Goal:** Deliver clear, actionable output.

#### Layout Hierarchy
```
[Header]
  Result Summary

[Section: Skin Profile]
  Skin Tone
  Undertone

[Section: Best Colors]
  Color chips

[Section: Avoid Colors]
  Color chips

[Section: Outfit Suggestions]
  Outfit cards (2–3)

[CTA]
  Try Another Photo / Edit

[Future CTA]
  Upgrade (optional)
```

#### Component Breakdown

| Component | Details |
|---|---|
| Skin Profile | Text: *"Medium, Warm"* |
| Best Colors | Visual color chips with label under each |
| Avoid Colors | Same format, less visual emphasis |
| Outfit Cards | Card with outfit title: *"Olive shirt + beige chinos"* (text-only for MVP) |
| Actions | "Try again" / "Change inputs" |

#### Interaction Logic
| Action | Outcome |
|---|---|
| "Try again" | → Upload Screen |
| "Edit" | → Manual Screen |

#### States

| State | Behavior |
|---|---|
| Empty (edge case) | "Could not generate results" + Retry button |
| API failure | "Unable to fetch results" + Retry button |

---

## 3. Global UX Patterns

### Loading States
- Buttons show spinner when clicked
- Disable repeated clicks while loading

### Navigation
- Simple back navigation
- No deep navigation stack

### Performance UX
- Show results within 30–60 seconds max
- If delay: show reassurance text

### Mobile Optimization
- Large tap targets
- Vertical scrolling only
- Minimal typing required

---

## 4. Design Principles Applied

| Principle | Implementation |
|---|---|
| **Reduce Thinking** | No complex inputs, no fashion jargon |
| **Instant Clarity** | Results shown visually (color chips), short direct text |
| **Fast Completion** | Max 3 steps: Input → Process → Result |
| **Forgiving UX** | Manual fallback always available, easy retry |

---

## 5. UX Philosophy Summary

This product should feel:

✅ **Fast** — Results in under 60 seconds  
✅ **Obvious** — No learning curve  
✅ **Helpful** — Actionable, not theoretical  

It should **not** feel like:

❌ A fashion course  
❌ A complex tool  
❌ A decision-heavy app  

---

*Design Spec Version: 1.0 | Product: StyleSense MVP | March 2026*
