---
name: jira-to-pr
description: >-
  End-to-end ticket workflow for customer FE: fetch Jira acceptance criteria,
  phase the work, implement with checks and review per phase, open a GitHub PR,
  optionally deploy. Use when starting a KAN-* ticket, implementing a Jira
  issue, or shipping work from ticket to PR.
---

# Jira → PR (customer FE)

## Workflow

1. **Jira (work)** — Fetch the issue via Atlassian MCP. Restate acceptance criteria. Ask if unclear; never invent scope.
2. **Phase plan** — Break into ordered isolated steps; note tests/negative cases per phase. Follow **phased-delivery**.
3. **GitHub (implementation)** — Branch named with `KAN-*`. For **each phase**: implement → tests when feasible → focused + **repo checks** (`npm run lint`, and tests if present) → mini-review → only then next phase. Before any commit: secret scan. Before push: **review-before-push**. Open PR with Jira key in title/body.
4. **Knowledge** — If behavior/runbook changed, update/add markdown (README or `docs/`); call out GitBook sync if that’s how you publish.
5. **Deploy** — Only if user asks; invoke **deploy-frontend** (re-runs review + secret checks).
6. **Close the loop** — Jira comment with PR/deploy links; transition status only when the user wants it moved.

## Per-phase loop (required)

```text
Phase N:
- [ ] Implement only this phase
- [ ] Add/update tests when feasible (happy + negative when relevant); Vitest not wired yet
- [ ] npm run lint (+ tests if present)
- [ ] Mini-review summary to user
- [ ] Optional: commit this phase alone
```

## Anti-patterns

- One giant implement → one giant lint/test → one giant review.
- Pushing or deploying without review-before-push.
- Skipping Jira fetch when a ticket key is known.
