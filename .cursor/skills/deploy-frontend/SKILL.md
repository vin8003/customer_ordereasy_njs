---
name: deploy-frontend
description: >-
  Builds the customer Next.js static export and deploys via PR into sibling
  customer_web_build main (Cloudflare Pages). Use when the user asks to deploy
  the customer frontend, ship Pages, or update customer_web_build.
---

# Deploy frontend (customer → customer_web_build)

## Preconditions

- User **explicitly** asked to deploy (or push live FE / Pages).
- Working tree in `customer_ordereasy_njs` is in the intended deploy state.

## Checklist

```text
Deploy progress:
- [ ] Confirm explicit deploy ask
- [ ] npm run lint green (and tests if present)
- [ ] npm run build → out/
- [ ] Replace ../customer_web_build (keep .git)
- [ ] Secret-scan artifact diff
- [ ] review-before-push on customer_web_build
- [ ] Commit on feature branch (not main)
- [ ] Open PR → main; wait for review
- [ ] Merge only with ≥1 approval
- [ ] Report PR/SHA + Pages implication
```

## Steps

1. **Confirm** the user wants a live Cloudflare Pages deploy from this build.
2. Run **repo checks**: `npm run lint` — block on failure. If a test script exists, run it too.
3. Build: `npm run build` — expect static export in `out/`.
4. Sync into `../customer_web_build` (preserve `.git`).
5. In `../customer_web_build`:
   - Checkout a feature branch (never commit on `main`).
   - Stage, secret-scan, follow **review-before-push**.
   - Commit; push the feature branch; open PR into **`main`**.
   - **Wait** for review time; **merge only with ≥1 approval**. Never push `main` directly. Never force-push.
6. Report: PR URL, merge SHA, Pages implication.

## Do not

- Deploy without an explicit user request.
- Commit/push directly to `main`/`master`.
- Merge without approval.
- Implement app features inside `customer_web_build`.
