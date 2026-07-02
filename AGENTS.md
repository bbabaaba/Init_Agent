# AGENTS.md

## Cursor Cloud specific instructions

This is a small Node.js + TypeScript tooling repo (the "AI Skills Collector & Evaluator" ledger tools). There is no long-running server or GUI — the "application" is a set of `tsx` scripts driven by npm.

### Services / commands

- Scripts run directly with `tsx` (no build/emit step). Package manager is npm (`package-lock.json`).
- `npm run validate-ledger` — validates `data/seen-items.json` structure and checks for duplicate IDs.
- `npm run smoke-test` — exercises the core flow: append/dedup a fixture item, generate a daily report, then re-run validation.

### Non-obvious caveats

- There is **no lint script** and **no build script**. Do not expect `npm run lint`/`npm run build`.
- `tsc --noEmit` is **not** wired up and will fail because `@types/node` is not a declared dependency (the scripts import Node builtins like `fs`/`path`/`crypto`). This is expected — type-checking via `tsc` is not part of the workflow; scripts execute via `tsx` at runtime.
- `npm run smoke-test` **mutates tracked files**: it writes `reports/<YYYY-MM-DD>.md` (today's date) and may append to `data/seen-items.json` if the fixture id `smoke-test/init-agent-fixture` is not already present. The fixture is already in the ledger, so normal runs only write a report. Do not commit these generated smoke-test artifacts unless that is the intent.
