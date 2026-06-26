# StyleSense — Project Logs

## Purpose

Historical record of significant project events, decisions, bugs fixed, and lessons learned.
Each entry should include a date and brief context.

For current architecture, see `architecture.md`.
For active issues, see `architecture.md` → Known Broken Or Fragile Areas.

---

## Format

```
### YYYY-MM-DD — Brief Title

**Context:** Why this happened
**Decision/Fix:** What was done
**Outcome:** Result
**Lesson:** What to remember going forward
```

---

## Log Entries

### 2026-06-26 — Knowledge Base Consolidated

**Context:** The `.gemini` folder was reviewed and restructured as a unified knowledge base.
**Decision:** Eliminated cross-file duplication, established clear file responsibilities, added Core Principles and MCP Awareness.
**Outcome:** Single-author-quality documentation with no contradictions.
**Lesson:** Each concept has exactly one authoritative location. Other files reference it.

### 2026-06-25 — Architecture Document Generated

**Context:** Full reverse-engineering of the codebase to create `architecture.md`.
**Decision:** Document runtime truth over historical plans. Mark known broken areas explicitly.
**Outcome:** Comprehensive architecture reference. Identified build blocker in `outfit/[id]/page.tsx`, API/history flow gap, and schema migration conflicts.
**Lesson:** Old migrations conflict with current UUID/Supabase schema. Always prefer `server/sql/*.sql` over `server/migrations/*.js` for the current code path.

### 2026-06-26 — API Contracts Document Created

**Context:** Full codebase analysis to document all API endpoints with verification.
**Decision:** Document only what is verifiable. Mark unknowns. Include frontend ↔ backend bidirectional verification.
**Outcome:** Found 2 broken frontend imports (`getProfile`, `softDeleteAccount`), 3 unused backend endpoints, dead code paths, and IDOR risk on unauthenticated analysis retrieval.
**Lesson:** The frontend expects functions that don't exist in `api.ts`. The history → result navigation is broken because `/result` ignores the `?id` query parameter.

### 2026-06-26 — Final Maintenance Pass

**Context:** Performed maintenance pass to improve knowledge base maintainability.
**Changes:**
- Added `checklist.md` (Definition of Done)
- Added "Future Splitting Guide" to `architecture.md` for when it grows too large
- Updated `README.md` reading order to include `checklist.md`
- Verified no duplicate rules, conflicting instructions, or broken cross-references
- Confirmed consistent terminology and formatting across all files
**Outcome:** Knowledge base is production-ready. 8 files, one connected system.
**Lesson:** Each file has exactly one responsibility. Cross-reference instead of duplicating.

### 2026-06-26 — History Page Fixed

**Context:** History page showed "Failed to fetch analysis history." or empty results despite 67 rows in DB.
**Root Cause:** `client/.env.local` had `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_7jToxhV4rjqsX9TwQ9zcig__miRSAe4` — not a valid Supabase JWT anon key. Client couldn't create/refresh sessions, so no Authorization header was sent (or backend had a stale pg Pool from prior broken DATABASE_URL).
**Fix:**
- Replaced client anon key with correct JWT key from `server/.env`
- Removed `DATABASE_URL` logging from `server/src/index.ts` and `server/src/utils/db.ts` (security)
- Added `pool.on('error')` handler in `db.ts` for resilience
- Removed excessive debug logging from history handler and `fetchAnalysisHistory()`
**Outcome:** History page loads real records. Endpoint returns HTTP 200 with correct data.
**Lesson:** Always ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the client matches the actual JWT anon key from the Supabase project. The `sb_publishable_` format is a different key type that cannot authenticate API requests.
