# StyleSense — Workflow

## Purpose

This file defines how work should be performed on the StyleSense project.
Follow this workflow for every task unless the user explicitly overrides it.

For core principles and priorities, see `README.md`.
For security requirements, see `security.md`.

---

## Feature Work

1. Understand the request fully.
2. Ask questions if anything is unclear.
3. Create a clear plan.
4. Wait for approval before coding.
5. Implement the change.
6. Verify the result.
7. Report what changed.

Do not start coding before the plan is approved.

---

## Bug Fix Workflow

1. Investigate the issue.
2. Find the root cause.
3. Explain the root cause clearly.
4. Check whether the same issue exists elsewhere in the project.
5. Propose a fix.
6. Wait for approval.
7. Apply the fix.
8. Verify the fix.
9. Check for regressions.

Do not patch blindly. Do not guess the cause.

---

## Before Modifying Code

- Understand how the file is used.
- Trace all imports and exports.
- Identify dependencies.
- Understand the execution flow.
- Check related files that may be affected.

Never modify code in isolation.

---

## Verify Before Delete

Before removing code:
- Search for all references.
- Verify imports, exports, routing, API usage, database usage, and dependencies.
- If there is any uncertainty, ask before deleting.

---

## Large Changes

If a task requires major refactoring, architecture changes, or many file updates:
- Stop first.
- Explain the impact.
- Ask for approval before proceeding.

---

## Breaking Changes

Always ask before making breaking changes.

---

## Scope

Do not make unrelated changes. If you notice weak or ugly code while working on something else, suggest improvements but do not change it automatically.

---

## Code Style Priority

When generating code, prioritize:
1. Readability
2. Simplicity
3. Scalability
4. Performance

---

## Git

Do not touch Git unless the user explicitly asks. This includes commits, branches, pushes, pull requests, and merges.

---

## Dependencies

Install new packages only when needed for the task. Explain why the dependency is needed.

---

## Documentation Updates

If a task affects documentation, update the relevant `.gemini` file:
- `architecture.md` — system design changes
- `api-contracts.md` — endpoint changes
- `security.md` — security policy changes
- `logs.md` — significant decisions, bugs fixed, lessons learned

---

## Confidence Reporting

At the end of technical answers, include confidence when useful:
- **High** — verified from code/evidence
- **Medium** — partially verified, some assumptions
- **Low** — limited evidence, needs verification

If confidence is not High, explain why.

---

## Testing

After implementation, provide testing guidance only when asked. When requested, include:
- Manual test steps
- Edge cases
- Failure cases
- Regression checks

---

## Performance

If the current implementation works but is slow:
- Suggest optimization.
- Do not optimize automatically unless asked.

Correctness and clarity come first.
