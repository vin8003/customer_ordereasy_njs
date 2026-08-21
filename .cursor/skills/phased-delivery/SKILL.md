---
name: phased-delivery
description: >-
  Breaks customer FE work into ordered phases with checks and mini-review after
  each isolated step. Use when starting non-trivial tickets, multi-file
  features, or when jira-to-pr needs a phase plan.
---

# Phased delivery (customer FE)

## When starting

1. Split work into phases that each leave the tree green (e.g. hooks/API → UI → edge cases → docs).
2. Share the phase list with the user when useful; adjust if they reorder/cut scope.

## Per phase

1. Implement **only** that phase’s files/behavior.
2. Add/update tests when feasible (happy + ≥1 negative/edge when relevant). Vitest is **not wired** yet — prefer small pure helpers; add colocated `*.test.ts(x)` once a runner exists.
3. Run focused checks for the touched area, then **repo checks**: `npm run lint` (and tests if present).
4. Mini-review the phase diff (correctness, readability, secrets); present a short summary.
5. Do **not** start the next phase until this one is verified. Optionally commit the phase alone when the user wants commits.

## Forbidden

Implementing everything first, then one giant lint/test run and one giant review.

## Wire-in

- **jira-to-pr**: step 2 = phase plan; step 3 = loop phases with checks + review each.
- **engineering-standards** / **phased-delivery** rules always apply in this repo.
