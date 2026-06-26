# Daily Collector — Cursor Automation Setup

Human-readable spec for the daily AI Skills Collector automation. Create this in the Cursor Automations editor after Phase 1 files are committed to this repo.

## Name

**Daily AI Skills Collector**

## Description

Discover new AI agent skills repos and solid GitHub solutions daily, deduplicate against the ledger, write an incremental markdown report, and commit changes to Init_Agent.

## Trigger

- **Type:** Schedule (cron)
- **Expression:** `0 9 * * *` (every day at 9:00)

## Git config

- **Repo:** This repository (`Init_Agent`)
- **Branch:** `master` (or default branch)

## Tools

- **MCP:** GitHub (dashboard-connected server — authenticate before saving automation)
- **Git:** Commit and push ledger + report

## Instructions (prompt)

```
You are the AI Skills Collector Agent. Follow the project skill at .cursor/skills/ai-skills-collector/SKILL.md exactly.

Each run:
1. Read data/seen-items.json for all known item IDs.
2. Search GitHub using the MCP server (fallback: gh CLI) with today's rotating query set.
3. Apply quality heuristics from the skill; skip items already in the ledger.
4. Append new items to data/seen-items.json with status "pending_review".
5. Write reports/YYYY-MM-DD.md using reports/TEMPLATE.md — incremental new items only.
6. Commit and push: data/seen-items.json and reports/YYYY-MM-DD.md with message "chore(collector): daily digest YYYY-MM-DD".

Do not rewrite past report files. Do not delete ledger entries. Cap at 5 search queries and 20 results per query.
```

## Settings

- **Memory enabled:** Yes (for query tuning only — ledger is dedup source of truth)
- **Model:** composer-2.5 or auto

## Prerequisites checklist

- [ ] GitHub MCP connected and authenticated in Cursor
- [ ] This repo pushed to GitHub with automation push access
- [ ] `.cursor/skills/ai-skills-collector/SKILL.md` committed
- [ ] `data/seen-items.json` and `reports/TEMPLATE.md` committed

## Weekly Evaluator (Phase 2 — not enabled by default)

When ready, create a second automation:

- **Name:** Weekly AI Skills Evaluator
- **Trigger:** `0 10 * * 1` (Mondays at 10:00)
- **Prompt:** Follow `.cursor/skills/ai-skills-evaluator/SKILL.md`
- **Output:** Update ledger statuses; write `reports/evaluations/YYYY-MM-DD.md`
