# Init_Agent — AI Skills Collector & Evaluator

Daily discovery of useful AI agent skills repos and solid GitHub solutions, with incremental deduplication and markdown reports.

## Agents

| Agent | Trigger | Skill | Purpose |
|-------|---------|-------|---------|
| **Collector** | Daily cron (9:00) | `.cursor/skills/ai-skills-collector/` | Search GitHub, deduplicate, write daily report |
| **Evaluator** | Weekly cron (Phase 2) | `.cursor/skills/ai-skills-evaluator/` | Score new items vs. existing promoted items |

## Data

- **Ledger:** [`data/seen-items.json`](data/seen-items.json) — all discovered items, dedup source of truth
- **Schema:** [`data/schema.json`](data/schema.json) — JSON Schema for ledger validation
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
