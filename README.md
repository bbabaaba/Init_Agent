# Init_Agent — AI Skills Collector & Evaluator

Daily discovery of useful AI agent skills repos and solid GitHub solutions, with incremental deduplication and markdown reports.

## What this project does

This repo is the workspace for two Cursor agents that build a curated catalog of AI-agent tooling on GitHub:

1. **Collector (daily).** Searches GitHub with a rotating set of queries (Cursor skills, MCP servers, agent frameworks, notable discussions), filters results through quality heuristics (activity, stars, concrete usage docs), and skips anything already known. Each genuinely new find is appended to the ledger `data/seen-items.json` with `status: "pending_review"`, and a digest of **only that day's new items** is written to `reports/YYYY-MM-DD.md`.
2. **Evaluator (weekly, Phase 2).** Re-reads the pending items, scores them against already-promoted peers on solidness, novelty, maintenance, and community signal, then promotes, archives, or marks them as duplicates.

The ledger is the single source of truth for deduplication: an item is never added twice, past reports are never rewritten, and rows are never deleted — statuses only move forward.

Two npm scripts keep the data trustworthy:

- `npm run validate-ledger` — checks every ledger row: field shapes, date order, `content_hash` matches the SHA-256 of the summary, and that `duplicate_of` / `supersedes` point at real item IDs. Prints `OK: N item(s), no duplicate IDs` on success, or a `FAIL:` list of errors (exit code 1).
- `npm run smoke-test` — exercises the core collector flow end-to-end without touching GitHub: appends a fixture item (or confirms it is deduplicated), generates a sample daily report under `reports/.smoke-test/`, re-runs validation, then cleans up. Real daily digests in `reports/` are never overwritten.

## Agents

| Agent | Trigger | Skill | Purpose |
|-------|---------|-------|---------|
| **Collector** | Daily cron (9:00) | `.cursor/skills/ai-skills-collector/` | Search GitHub, deduplicate, write daily report |
| **Evaluator** | Weekly cron (Phase 2) | `.cursor/skills/ai-skills-evaluator/` | Score new items vs. existing promoted items |

## Data

- **Ledger:** [`data/seen-items.json`](data/seen-items.json) — all discovered items, dedup source of truth
- **Schema:** [`data/schema.json`](data/schema.json) — field definitions; enforced by `npm run validate-ledger`
- **Reports:** [`reports/YYYY-MM-DD.md`](reports/) — incremental daily digests (new items only)

## Prerequisites

1. **GitHub MCP** — Connect and authenticate in [Cursor MCP settings](https://cursor.com/docs/mcp). Required for Cursor Automation `mcp` action.
2. **`gh` CLI** — Optional fallback when MCP search limits are hit (`gh search repos`, `gh repo view`).
3. **Cursor Automation** — See [`automations/daily-collector.md`](automations/daily-collector.md) for setup after first commit.

## Daily workflow (Collector)

1. Load `data/seen-items.json`
2. Search GitHub via MCP (rotating query sets in skill)
3. Filter by quality heuristics; skip known IDs
4. Append new items with `status: "pending_review"`
5. Write `reports/YYYY-MM-DD.md` (today's new items only)
6. Commit ledger + report to this repo

## Evaluator workflow (Phase 2)

1. Read ledger items where `status == "pending_review"`
2. Score against promoted peers (solidness, novelty, maintenance, community)
3. Transition status to `promoted`, `duplicate_of`, or `archived`
4. Write `reports/evaluations/YYYY-MM-DD.md`

## Validate ledger

```bash
npm run validate-ledger
npm run smoke-test   # verify append, dedup, report generation
```

## Project layout

```
Init_Agent/
├── .cursor/skills/
│   ├── ai-skills-collector/
│   └── ai-skills-evaluator/
├── data/
├── reports/
├── automations/
└── scripts/
```
