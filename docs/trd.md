# Technical Requirement Document (TRD)
## Product: Color & Style Analyzer — StyleSense (Men)

---

## 1. System Architecture Overview

### Architecture Style
- Client–Server architecture
- Stateless backend
- Monolithic backend (V1)

### High-Level Flow

```
Frontend (Web / Mobile)
        ↓
Backend API Layer
        ↓
Business Logic (Color Mapping Engine)
        ↓
Database (PostgreSQL)
        ↓
Image Storage (S3 / Cloudinary)
```

### Recommended Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Next.js) |
| Backend | Node.js (Express or Fastify) |
| Database | PostgreSQL |
| Storage | AWS S3 or Cloudinary |
| Frontend Hosting | Vercel |
| Backend Hosting | AWS / Railway / Render |

---

## 2. Frontend Responsibilities

### Core Responsibilities
- Handle user interaction
- Upload images
- Collect manual inputs
- Display results

### Key Components

| Component | Purpose |
|---|---|
| Landing Page | CTA: Upload photo / Start analysis |
| Upload Component | Accept image, validate file size/type, show preview |
| Manual Input UI | Skin tone (light/medium/dark) + undertone (warm/cool/neutral) |
| Result Screen | Show skin tone, best colors, avoid colors, outfit suggestions |

### Frontend Logic
- Input validation
- Loading states
- Error handling

---

## 3. Backend Responsibilities

### Core Responsibilities
- Handle API requests
- Process inputs
- Execute recommendation logic
- Store data

### Key Modules

#### Image Handler
- Accept image uploads
- Store in S3 / Cloudinary
- Return image URL

#### Skin Tone Processor (V1)
- Optional basic logic OR manual input
- Prefer manual selection for accuracy

#### Recommendation Engine
- **Input:** Skin tone + Undertone
- **Output:** Best colors, avoid colors, outfit suggestions

#### API Layer
- REST APIs
- JSON responses

---

## 4. Database Schema

### Users Table
```sql
users (
  id         UUID PRIMARY KEY,
  created_at TIMESTAMP,
  is_guest   BOOLEAN DEFAULT TRUE
)
```

### Analyses Table
```sql
analyses (
  id         UUID PRIMARY KEY,
  user_id    UUID,
  image_url  TEXT,
  skin_tone  VARCHAR,
  undertone  VARCHAR,
  created_at TIMESTAMP
)
```

### Results Table
```sql
results (
  id          UUID PRIMARY KEY,
  analysis_id UUID,
  best_colors JSONB,
  avoid_colors JSONB,
  outfits     JSONB
)
```

### Color Profiles — Config Example
```json
{
  "medium_warm": {
    "best_colors": ["olive", "beige", "brown", "cream"],
    "avoid_colors": ["neon", "icy blue"],
    "outfits": [
      "Olive shirt + beige chinos",
      "Brown t-shirt + black jeans"
    ]
  }
}
```

---

## 5. API Structure

### Base URL
```
/api/v1
```

### Endpoints

#### POST `/analysis/upload` — Create Analysis (Photo)
```
Request : multipart/form-data { image: File }
Response: { "analysis_id": "uuid", "image_url": "string" }
```

#### POST `/analysis/manual` — Manual Analysis
```
Request : { "skin_tone": "medium", "undertone": "warm" }
Response: { "analysis_id": "uuid", "result": ResultObject }
```

#### GET `/analysis/result/:id` — Get Results
```json
// Response
{
  "skin_tone"   : "medium",
  "undertone"   : "warm",
  "best_colors" : ["olive", "beige"],
  "avoid_colors": ["neon"],
  "outfits"     : ["Olive shirt + beige chinos"]
}
```

#### GET `/health` — Health Check
```
Response: 200 OK
```

---

## 6. Authentication Strategy

### V1 Approach
- No mandatory login
- Guest-based usage

### Implementation
1. Generate `UUID` on frontend (`guest_id`)
2. Store in `localStorage`
3. Send with every API request via `x-guest-id` header

### Future
- Google login / Email authentication
- User accounts with saved history

---

## 7. Third-Party Dependencies

### Required (V1)
| Package | Purpose |
|---|---|
| AWS S3 or Cloudinary | Image storage |
| Sharp | Image processing / resizing |
| Zod or Joi | Input validation |

### Optional (Future)
- Analytics: PostHog / Mixpanel
- AI APIs for face detection

---

## 8. Scalability Considerations

| Area | Strategy |
|---|---|
| Backend | Stateless APIs, horizontal scaling ready |
| Storage | CDN via Cloudinary or S3 + CloudFront |
| Caching | In-memory color profiles; Redis optional later |
| Database | Single PostgreSQL instance → add read replicas when needed |
| Rate Limiting | Prevent abuse via middleware |
| Async Processing | Queues (BullMQ / RabbitMQ) if needed in future |

---

## 9. Key Technical Decisions

| Decision | Rationale |
|---|---|
| No AI in V1 | Keep it fast and simple |
| Rule-based recommendation engine | Predictable, easy to tune |
| Manual input prioritized over auto-detection | More reliable in MVP |
| Focus on speed and simplicity | Deliver value within 60 seconds |

---

## 10. Summary

This system is:
- A **lightweight backend service**
- A **rule-based recommendation engine**
- A **simple frontend interface**

**Core idea:**
```
Input → Mapping → Recommendation → Output
```

**Goal:** Deliver fast, clear, and actionable styling advice with minimal complexity.

---

*TRD Version: 1.0 | Product: StyleSense MVP | March 2026*
