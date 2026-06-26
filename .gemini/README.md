# .gemini Knowledge Base

## Purpose

This folder is the permanent project knowledge base for StyleSense.
Before responding to the first project-related message in any new chat, read the relevant documents to understand the project context.

---

## Core Principles

1. The primary objective is to build the best possible website.
2. Understand before changing anything.
3. Plan first for every feature.
4. Never assume or guess.
5. Verify from the codebase whenever possible.
6. Ask questions when information is missing.
7. Be brutally honest.
8. Prefer root-cause fixes over symptom fixes.
9. Security comes before convenience.
10. If the entire project may be responsible for a bug, investigate that possibility before fixing.
11. If something cannot be verified, explicitly write: **UNKNOWN - NEEDS VERIFICATION**
12. If you genuinely do not know something, clearly say so.
13. Use available MCP servers whenever they help verify information instead of guessing.
14. If MCP access requires permission or user interaction, ask first.
15. If conversation context becomes unreliable, say: **Start a Fresh Chat** then generate a complete project handoff.

---

## MCP Awareness

The following MCP servers are available as verification tools:

| Server | Use For |
|--------|---------|
| Context7 | Library/framework documentation lookup |
| GitHub | Repository operations, PR management |
| Playwright | Browser testing, UI verification |
| Serena | Code analysis and understanding |
| Supabase | Database operations, auth verification, RLS policies |

Use these whenever they provide more reliable information than assumptions.
Do not duplicate their capabilities in documentation — reference them as tools.

---

## Reading Order

1. `project.md` — What we are building
2. `architecture.md` — How it is built (single source of truth for system design)
3. `workflow.md` — How work should be performed
4. `security.md` — Security requirements and policies
5. `api-contracts.md` — Verified API endpoint documentation
6. `checklist.md` — Definition of Done for every task
7. `logs.md` — Historical project knowledge, decisions, and lessons learned

---

## After Reading

- Treat these documents as project context for the entire conversation.
- Do not reread every file before each response.
- Reread only when: the user requests it, a document changed, context appears missing, or a decision needs verification.

---

## Instruction Priority

If instructions conflict, follow this order:

1. User's latest message
2. `.gemini` documentation
3. Previous conversation context

---

## Priority Stack

When making decisions, prioritize in this order:

1. Correctness
2. Security
3. Reliability
4. Maintainability
5. Performance
6. User Experience

Never sacrifice correctness for speed.

---

## Verification Priority

When answering questions, verify information in this order:

1. Project source code
2. MCP tools
3. Project documentation (.gemini)
4. Official documentation
5. Model knowledge

Never choose a lower-priority source when a higher-priority source is available.

If verification is impossible, write: **UNKNOWN - NEEDS VERIFICATION**

---

## Evidence First

Support all conclusions with evidence:
- Source code
- Error messages
- Logs / stack traces
- Configuration files
- MCP server verification

If evidence is insufficient, state: "Insufficient evidence to determine the root cause."

---

## Scope Control

Stay within the requested scope. Do not:
- Refactor unrelated code
- Change project architecture
- Upgrade dependencies
- Introduce new libraries
- Modify unrelated features

Unless the user explicitly requests those changes.

---

## Context Management

If the conversation becomes too large and context may be lost, say:

**Start a Fresh Chat**

Then provide a handoff containing:
- Current project status
- Architecture summary
- Completed work
- Pending work
- Known issues
- Next recommended task
