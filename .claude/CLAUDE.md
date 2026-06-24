# CLAUDE.md — StyleSense (Fashion AI SaaS)

> Project context for Claude Code. Target <3k tokens.

---

## 1. Project Summary

Full-stack AI fashion analysis SaaS.

**Flow:** Home → Analysis → Loading → Result → Wardrobe → History

User uploads face image on `/analysis` → backend extracts skin tone (Python/OpenCV + MediaPipe) → Anthropic API returns color + outfit recommendations → result stored and viewable in Wardrobe/History.

---

## 2. Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind, Framer Motion, Axios
- **Backend:** Node.js + Express (TS), Python (OpenCV + MediaPipe) for skin-tone detection
- **AI:** Anthropic API with fallback logic
- **DB:** PostgreSQL (`analyses`, `history` tables)
- **Auth:** Supabase Auth / JWT (in progress, unstable)

---

## 3. Architecture

**Frontend**
- `src/app/*` — routes (`/`, `/analysis`, `/loading`, `/result`, `/wardrobe`, `/history`)
- `components/result/AnalysisResultView.tsx` — core result UI
- `lib/api.ts` — Axios layer (baseURL normalization + guest-id)
- `lib/supabase.ts` — auth client

**Backend**
- `server/routes/analysis.ts` — `/api/v1/analysis/*`
- `server/middleware/*` — helmet, cors, rate-limit, logger
- `detect.py` — Python skin-tone pipeline

---

## 4. Local Dev

```bash
# Frontend (port 3000)
cd frontend && npm run dev

# Backend (port 3001)
cd server && npm run dev

# Python detector runs as subprocess — requires venv active
cd server/python && source .venv/bin/activate
```

**Required env vars** (`.env` — currently contains secrets, needs cleanup):
- `ANTHROPIC_API_KEY`
- `DATABASE_URL`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `JWT_SECRET`

---

## 5. Current State

**[fixing]** — actively being worked on
- Supabase Auth (login/signup/session) — token auth unstable, "Invalid token" errors
- Attach `user_id` to analyses; add backend auth middleware
- Protect `/history` + `/wardrobe` routes
- Consolidate API paths — deprecate `/api/analyze`, keep `/api/v1/analysis`
- UI fidelity pass vs Stitch design
- Replace placeholder outfit visuals

**[known]** — not currently being fixed
- Backend sometimes returns empty `{}` response
- Error handling inconsistent in analysis flow
- Fallback color logic inconsistent
- Layout breaks on some screen sizes
- `.env` contains sensitive keys — cleanup pending
- PDF export planned but not scoped

---

## 6. Routing Rules (CRITICAL)

- `/analysis` is the ONLY entry point for image submission
- `/loading` MUST NEVER open automatically — only after user clicks "Analyze"
- `/result` MUST NOT call the API — reads from storage only
- `/upload` route is **deprecated** — do not use, do not recreate
- Any reference to `/upload` must be replaced with `/analysis`
- No page may redirect on mount (`useEffect`) without a guard condition (e.g. verify required storage key exists, verify auth state, verify user action flag)

---

## 7. Frontend Data Flow (CRITICAL)

- API call happens ONLY in `/loading`
- `/analysis` only collects the image
- `/result` only reads from storage

**Storage keys:**
- `uploaded_image` — base64 or blob URL of user upload
- `analysis_result` — full API response
- `last_analysis` — cached copy for Wardrobe/History hydration

---

## 8. Auth Behavior

- After login → redirect to `/analysis`
- **Protected routes:** `/history`, `/wardrobe`
- **Public routes:** `/`, `/analysis`, `/result`
- **Session strategy:** Supabase session in `lib/supabase.ts`; JWT attached to Axios requests via interceptor in `lib/api.ts`
- **Guest flow:** pre-auth users get a `guest-id` header; this system will be removed once auth is stable — do not build new features against it

---

## 9. Code Conventions

- TypeScript strict mode, functional React components
- Tailwind only — no CSS files, no CSS modules
- API responses parsed in `lib/api.ts`; components receive typed props, never raw Axios responses
- AI output is unreliable — always validate shape before rendering, use defaults for missing fields (see `AnalysisResultView.tsx` for the defensive pattern)
- Keep UI and data layers separate — no `fetch` inside components

---

## 10. Do Not Touch Without Care

- **Backend API contracts** — frontend depends on exact response shape of `/api/v1/analysis/*`. Don't rename fields.
- **`detect.py`** — requires active Python venv; changes need manual testing of the full pipeline
- **DB schema** — no ad-hoc migrations; schema changes need a migration file
- **Framer Motion variants in `AnalysisResultView.tsx`** — animations are tuned; check the result page visually after touching them
- **Storage keys (§7)** — renaming breaks `/result` and History hydration

---

## 11. Untested Scenarios

Large images (>5MB), slow network / timeouts, AI failure fallback path, empty history state, mobile responsiveness, auth session persistence across refresh, unauthorized route access.

---

## 12. Working Principles

- **Simplicity first** — smallest change that solves the problem
- **Root cause, not patch** — no temporary fixes; if a fix feels hacky, flag it
- **Minimal blast radius** — touch only what's necessary; prefer additive changes
- **Plan before non-trivial work** — write a short plan to `tasks/todo.md` for anything >3 steps or touching architecture; confirm before implementing
- **Verify before "done"** — demonstrate the change works (test output, screenshot, or reproduced-then-fixed log) rather than asserting it

## vexp - Context-Aware AI Coding <!-- vexp v2.0.32 -->

### MANDATORY: use vexp pipeline - do NOT grep or glob the codebase
For every task - bug fixes, features, refactors, debugging:
**call `run_pipeline` FIRST**. It executes context search + impact analysis +
memory recall in a single call, returning compressed results.

Do NOT use grep, glob, Bash, or cat to search/explore the codebase.
vexp returns pre-indexed, graph-ranked context that is more relevant and
uses fewer tokens than manual searching. Prefer `get_skeleton` over Read to
inspect files (detail: minimal/standard/detailed, 70-90% token savings).
Only use Read when you need exact raw content to edit a specific line.

### Primary Tool
- `run_pipeline` - **USE THIS FOR EVERYTHING**. Single call that runs
  capsule + impact + memory server-side. Returns compressed results.
  Auto-detects intent (debug/modify/refactor/explore) from your task.
  Includes full file content for pivots.
  Examples:
  - `run_pipeline({ "task": "fix JWT validation bug" })` - auto-detect
  - `run_pipeline({ "task": "refactor db layer", "preset": "refactor" })` - explicit
  - `run_pipeline({ "task": "add auth", "observation": "using JWT" })` - save insight in same call

### Other MCP tools (use only when run_pipeline is insufficient)
- `get_skeleton` - **preferred over Read** for inspecting files (minimal/standard/detailed detail levels, 70-90% token savings)
- `index_status` - indexing status and health check
- `expand_vexp_ref` - expand V-REF hash placeholders in v2 compact output

### Workflow
1. `run_pipeline("your task")` - ALWAYS FIRST. Returns pivots + impact + memories in 1 call
2. Need more detail on a file? Use `get_skeleton({ files: [...], detail: "detailed" })` - avoid Read unless editing
3. Make targeted changes based on the context returned
4. `run_pipeline` again ONLY if you need more context during implementation
5. Do NOT chain multiple vexp calls - one `run_pipeline` replaces capsule + impact + memory + observation

### Subagent / Explore / Plan mode
- Subagents CAN and MUST call `run_pipeline` - always include the task description
- The PreToolUse hook blocks Grep/Glob when vexp daemon is running
- Do NOT spawn Agent(Explore) to freely search - call `run_pipeline` first,
  then pass the returned context into the agent prompt if needed
- Always: `run_pipeline` -> get context -> spawn agent with context

### Smart Features (automatic - no action needed)
- **Intent Detection**: auto-detects from your task keywords. "fix bug" -> Debug, "refactor" -> blast-radius, "add" -> Modify
- **Hybrid Search**: keyword + semantic + graph centrality ranking
- **Session Memory**: auto-captures observations; memories auto-surfaced in results
- **LSP Bridge**: VS Code captures type-resolved call edges
- **Change Coupling**: co-changed files included as related context

### Advanced Parameters
- `preset: "debug"` - forces debug mode (capsule+tests+impact+memory)
- `preset: "refactor"` - deep impact analysis (depth 5)
- `max_tokens: 12000` - increase total budget for complex tasks
- `include_tests: true` - include test files in results
- `include_file_content: false` - omit full file content (lighter response)

### Multi-Repo Workspaces
`run_pipeline` auto-queries all indexed repos. Use `repos: ["alias"]` to scope.
Use `index_status` to discover available repo aliases.
<!-- /vexp -->