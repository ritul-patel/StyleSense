# Contributing to StyleSense

Thank you for your interest in contributing to StyleSense. This document explains how to set up your development environment, the branching strategy, commit conventions, and the pull request process.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Branch Strategy](#branch-strategy)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

By contributing, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/StyleSense.git
   cd StyleSense
   ```
3. **Add the upstream remote:**
   ```bash
   git remote add upstream https://github.com/original-owner/StyleSense.git
   ```

---

## Development Setup

Follow the [Getting Started](README.md#getting-started) section of the README to install dependencies and configure environment variables.

Quick summary:
```bash
npm install
npm --prefix client install
npm --prefix server install

# Copy and fill in env files
cp client/.env.example client/.env.local
cp server/.env.example server/.env

# Run migrations
npm --prefix server run migrate up

# Start dev servers
npm run dev
```

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code. Direct pushes are blocked. |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `docs/<name>` | Documentation-only changes |
| `refactor/<name>` | Code restructuring without behavior change |
| `chore/<name>` | Tooling, dependencies, CI |

Always branch off `main`:
```bash
git checkout main
git pull upstream main
git checkout -b feat/your-feature-name
```

---

## Commit Convention

StyleSense follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

**Format:** `<type>(<scope>): <short description>`

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Tooling, dependencies, CI config |

**Examples:**
```
feat(analysis): add manual skin tone selection
fix(auth): handle expired JWT gracefully
docs(readme): update environment variable table
perf(images): enable AVIF format in next.config
test(engine): add tests for dark + cool undertone profile
```

---

## Pull Request Process

1. **Keep PRs focused** — one feature or fix per PR. Large PRs are hard to review.
2. **Fill in the PR template** completely. Incomplete PRs may be closed.
3. **Ensure tests pass:**
   ```bash
   npm --prefix server run test
   npm --prefix client run lint
   ```
4. **Request a review** — tag the maintainer for review.
5. **Respond to feedback** — address review comments or explain your reasoning.
6. **Squash on merge** — the maintainer will squash commits on merge to keep the history clean.

---

## Coding Standards

### TypeScript

- **No `any`** — use proper types or `unknown` with narrowing. If `any` is unavoidable, add a comment explaining why.
- **Interfaces over type aliases** for object shapes.
- **Zod** for all runtime validation on the server — never trust raw input.
- **Strict mode** is enabled in `tsconfig.json` — all errors must be resolved.

### React / Next.js

- Use the **App Router** conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).
- **Server Components by default** — only add `"use client"` when the component genuinely needs browser APIs or state.
- Keep components **focused** — one responsibility per component.
- Use `next/image` for all images — never raw `<img>` tags.
- No `dangerouslySetInnerHTML` with API-sourced data.

### Express / Backend

- All route handlers must use the global `errorHandler` — never swallow errors silently.
- Validate every request body with **Zod** before processing.
- Rate-sensitive routes (analysis, AI) must use the `analysisLimiter` middleware.
- Never log API keys, passwords, or full JWTs — log prefixes only.

### General

- **No hardcoded URLs or secrets** in source code — use environment variables.
- **No committed `.env` files** — only `.env.example` with placeholder values.
- Remove all `console.log` debug statements before submitting a PR.

---

## Testing

### Server (Jest)

```bash
npm --prefix server run test
```

Tests live in:
- `server/src/engine/tests/` — recommendation engine unit tests
- `server/src/services/recommendationEngine.test.ts` — service-level tests

When adding a new feature, add a corresponding test. When fixing a bug, add a regression test.

### Manual Testing Checklist

Before submitting a PR, verify:

- [ ] Both analysis flows work (manual + upload)
- [ ] Auth flows work (sign up, log in, log out, password reset)
- [ ] Error states show correct user-facing messages
- [ ] The UI is usable on a 375px mobile viewport
- [ ] `GET /health` returns 200

---

## Reporting Bugs

Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) issue template. Include:

- Steps to reproduce
- Expected vs actual behavior
- Browser and OS
- Any console errors

---

## Suggesting Features

Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) issue template. Describe the problem you're solving, not just the solution.
