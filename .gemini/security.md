# StyleSense — Security Requirements

## Purpose

Security requirements for the StyleSense project.
Security is mandatory for every feature, API, upload flow, database change, and third-party integration.

For general workflow rules, see `workflow.md`.
For architecture details, see `architecture.md`.
For API-specific security review, see `api-contracts.md` → Security Review section.

---

## Security Standard

StyleSense follows **Production Standard** security:
- Strong security
- Practical developer workflow
- No unnecessary overengineering
- No careless shortcuts

Security must never be treated as optional.
Security comes before convenience (see `README.md` → Core Principles).

---

## Authentication

- Authentication weaknesses must be explained and approved before fixing.
- Do not silently change authentication behavior.

## Authorization

- Missing authorization on protected routes is a **critical** issue.
- Fix before anything else.

## Secrets

Never hardcode in the codebase:
- API keys, JWT secrets, database passwords
- Cloudinary secrets, OAuth secrets, Supabase secrets

If found in code, move to environment variables immediately.

## Dependencies

- Recommend updating dependencies with known security issues.
- Explain the risk.

---

## File Upload Security

Every upload must validate:
- File type (MIME header)
- Actual file format (Sharp metadata)
- File size (5 MB limit)
- Image integrity

---

## Backend Security Checklist

Every backend change must be reviewed for:
- SQL Injection (use parameterized queries)
- XSS (JSON responses, no raw HTML injection)
- CSRF (Bearer token auth — not cookie-based, so N/A)
- Path Traversal
- Command Injection (Python subprocess uses execFile, not shell)

---

## Error Handling

In production:
- Never show stack traces to users
- Never expose internal details in UI
- Log internal errors securely on the server only

---

## Logging

Never log:
- Passwords, tokens, JWTs, cookies
- API keys, OAuth tokens
- Personal user data
- Connection strings with credentials

**Known violation:** `DATABASE_URL` is currently logged by server code — must be removed.

---

## Transport Security

- Production must always use HTTPS
- HTTP acceptable only for local development

---

## Security Review Requirement

Before a task is complete, perform a security review for:
- Authentication
- Authorization
- Uploads
- AI endpoints
- Database changes
- External integrations

---

## Known Security Issues

Tracked issues from codebase analysis (do not fix without approval — report only):

1. `DATABASE_URL` logged in `server/src/index.ts` and `server/src/utils/db.ts`
2. IDOR risk on `GET /api/v1/analysis/:id` and `/result/:id` — unauthenticated access bypasses ownership check
3. Sentry DSN hard-coded in client files
4. PostHog config logged to browser console
5. Debug `console.log` in `/history` handler logs SQL queries and user objects
6. `@anthropic-ai/sdk` in dependencies — UNKNOWN - NEEDS VERIFICATION whether it exposes keys at runtime

---

## Confidence Rule

When uncertain about security:
- State clearly: "I cannot verify this is secure from the available information."
- Use MCP servers (especially Supabase) to verify when possible.
