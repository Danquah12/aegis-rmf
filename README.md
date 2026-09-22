# AegisRMF

Standalone NIST RMF workbench. System of record for Prepare through Monitor. eMASS, CSAM, and Xacta are not required.

## What it does

- Organization Prepare (Phase 0) and system registration
- FIPS 199 categorize, 800-53B select, SSP implement
- 800-53A assess with EXAMINE / INTERVIEW / TEST
- Authorization package and AO gate (humans only issue an ATO)
- Continuous monitoring
- Auto-scan on Assess: AXIOM DAST, SCA, and IaC

Agents collect, analyze, and recommend. Humans retain authority over determinations, residual risk, and authorization.

## Stack

TanStack Start, React 19, Tailwind, PGLite / Postgres.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run typecheck
```
