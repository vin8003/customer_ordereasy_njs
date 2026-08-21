---
name: review-before-push
description: >-
  Pre-push checklist for customer_ordereasy_njs: summarize commits/diff, secret
  skim, confirm npm run lint green (and tests if present), call out deploy side
  effects. Use when about to git push, open/update a PR, or when the user asks
  to push or deploy.
---

# Review before push (customer FE source)

## When

Before any `git push` (feature branch, PR update) or when the user asks to push/deploy. Also invoked from **deploy-frontend** and **jira-to-pr**.

## Checklist

1. **Range** — `git log` / `git diff` against upstream (or base branch). Summarize commits and notable files.
2. **Secrets** — Skim that diff for `.env*`, credentials, `service_account`, `*.pem`/`*.key`, Bearer tokens, `AKIA…`, `BEGIN … PRIVATE KEY`, accidental key material.
3. **Repo checks** — Confirm `npm run lint` was run green; cite command + outcome. If a test script is present, run it green too. If not run yet, run now; **block push on failure**. (Vitest is not wired in this repo.)
4. **Deploy side effects** — Pushing this source repo alone does **not** ship Pages. Live FE requires **deploy-frontend** → sibling `customer_web_build` `main`. Call that out if the user might think push = deploy.
5. **Present findings** — Short review to the user; push only after confirmation (or prior explicit push/deploy ask in the same turn).

## Output template

```markdown
## Pre-push review
- **Branch → remote**: …
- **Commits**: …
- **Risk areas**: …
- **Secrets skim**: clean / issues found
- **Checks**: `npm run lint` — pass/fail; tests if present — …
- **Deploy implication**: none (source only) / will trigger Pages if also deploying build repo
- **Ask**: OK to push?
```
