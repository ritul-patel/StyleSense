# StyleSense

AI-powered personal styling platform. Upload a photo, get your color analysis, outfit recommendations, and product matches in seconds.

**Live:** [stylesense.co.in](https://www.stylesense.co.in)

## What it does

- Analyzes skin tone and undertone from a face photo (OpenCV + Python)
- Determines your seasonal color type (Spring, Summer, Autumn, Winter)
- Recommends a personalized color palette
- Scores products across 7 dimensions (color, season, undertone, occasion, style, material, formality)
- Provides outfit combinations matched to your profile
- Lets you build and save a virtual wardrobe

## Tech

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion  
**Backend:** Express 5, TypeScript, PostgreSQL (Supabase)  
**AI:** Python OpenCV (skin detection), Google Gemini 2.5 Flash (product metadata)  
**Infra:** Vercel (frontend), Render (backend), Supabase (DB + auth + storage), Sentry, PostHog

## Setup

```bash
git clone https://github.com/ritul-patel/StyleSense.git
cd StyleSense

# Install
npm --prefix client install
npm --prefix server install

# Configure
cp client/.env.example client/.env.local
cp server/.env.example server/.env
# Fill in your Supabase, Gemini, and Cloudinary keys

# Run
npm run dev
```

Needs: Node 20+, Python 3 with opencv-python-headless + numpy

## Project structure

```
client/          Next.js frontend (App Router)
server/          Express API + Python detector
server/python/   OpenCV skin analysis script
server/src/      TypeScript source (routes, services, engine)
```

## Key features

- **Color Analysis** - photo upload or manual input
- **Recommendation Engine** - 7-dimension scoring with explanations
- **Product Catalog** - admin CRUD, CSV import, AI metadata generation
- **Wardrobe** - save products, build outfits, organize collections
- **Blog CMS** - markdown editor, categories, tags, SEO
- **Admin Panel** - dashboard, products, outfits, users, analytics, feedback, blog
- **Guest Flow** - upload photo without login, auth gate before AI processing

## API

Base: `/api/v1`

| Endpoint | Purpose |
|----------|---------|
| POST /analysis/upload | Photo analysis |
| POST /analysis/manual | Manual skin tone input |
| GET /products | Product catalog |
| GET/POST /wardrobe | Wardrobe management |
| GET/POST /saved-outfits | Saved looks |
| GET /blog/posts | Published blog posts |
| POST /admin/blog/posts | Create blog post |
| POST /admin/metadata/generate-batch | AI metadata generation |

## Deployment

- **Frontend** deploys to Vercel on push to main
- **Backend** deploys to Render on push to main
- **Database** managed via Supabase (migrations in `server/sql/`)

## License

MIT

## Author

Built by [Ritul Patel](https://github.com/ritul-patel)
