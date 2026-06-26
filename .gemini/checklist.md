# StyleSense — Definition of Done

## Purpose

Minimum quality checklist before considering any task complete.
Every item must be verified — not assumed.

---

## Development

- [ ] Project builds successfully (`npm --prefix server run build`)
- [ ] No TypeScript errors in modified files
- [ ] No ESLint errors in modified files
- [ ] No console errors at runtime
- [ ] No runtime errors in affected flows

## Quality

- [ ] Code is readable and follows existing patterns
- [ ] No duplicated logic introduced
- [ ] No unnecessary complexity added
- [ ] Scope remained limited to the requested task
- [ ] No unrelated changes included

## Security

- [ ] Authentication verified (if endpoint requires it)
- [ ] Authorization verified (ownership checks where applicable)
- [ ] Input validation checked (Zod, multer, or manual)
- [ ] No secrets exposed in code or logs
- [ ] Security review completed (see `security.md`)

## API

- [ ] API contract remains valid (see `api-contracts.md`)
- [ ] Frontend and backend remain consistent
- [ ] No endpoint regressions introduced
- [ ] Response format matches documented contract

## Testing

- [ ] Requested functionality verified (manually or with tests)
- [ ] Existing functionality not broken
- [ ] No obvious regressions in related flows
- [ ] Edge cases considered

## Documentation

- [ ] `architecture.md` updated (if system design changed)
- [ ] `api-contracts.md` updated (if endpoints changed)
- [ ] `security.md` updated (if security posture changed)
- [ ] `logs.md` updated (if significant decision or lesson learned)

## Completion

- [ ] Confidence level evaluated and reported
- [ ] Remaining UNKNOWN items documented
- [ ] If context is becoming unreliable: recommend **Start a Fresh Chat**

---

## When to Skip Items

- **Read-only tasks** (investigation, explanation): Skip Development, API, Testing sections.
- **Documentation-only tasks**: Skip Development, Security, API, Testing sections.
- **Bug investigation** (not fixing): Skip everything except Completion.

Apply the checklist proportionally to the task scope.
