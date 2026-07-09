---
name: ai-skills-collector
description: >-
  Daily GitHub discovery agent for AI agent skills repos, Cursor skills/rules,
  MCP servers, and solid AI solutions. Deduplicates against data/seen-items.json,
  appends incremental items, and writes reports/YYYY-MM-DD.md. Use when running
  the daily collector automation or manually collecting new AI skills from GitHub.
---

# AI Skills Collector

Discover useful AI skills repos and solid GitHub solutions. Append **only new items** to the ledger and write an **incremental daily report**.

## Files

| File | Purpose |
|------|---------|
| `data/seen-items.json` | Dedup source of truth — load before every search |
| `data/schema.json` | Ledger field definitions |
| `reports/TEMPLATE.md` | Daily report format |
| `search-queries.md` | Rotating GitHub search queries |

## Run procedure

Execute these steps in order on every run.

### 1. Load ledger

Read `data/seen-items.json`. Build a set of all existing `id` values. Never add a row whose `id` already exists.

**Dedup keys:**

| Type | `id` format |
|------|-------------|
| Repo | `owner/repo` |
| Issue / Discussion | Full GitHub URL or node ID |
| Skill file | `owner/repo:path/to/SKILL.md` |

If an existing item's summary materially changed (re-fetch README), update `last_seen`, `content_hash`, and append a `changelog[]` entry — do **not** create a duplicate row.

### 2. Search GitHub

Use the **GitHub MCP** server as primary tooling. If MCP is unavailable or rate-limited, fall back to `gh`:

```bash
gh search repos "<query>" --sort updated --limit 20 --json fullName,description,stargazerCount,url,updatedAt
gh search issues "<query>" --limit 10 --json title,url,repository
```

Pick **5 queries** for today's run using the rotation in [search-queries.md](search-queries.md). Use day-of-year modulo query groups to rotate fairly.

**Rate limits:** Max 5 queries × 20 results per run.

### 3. Quality heuristics

Include a candidate only if **all** of the following pass:

1. **Scope** — Related to AI agents, Cursor skills/rules, MCP servers, LLM tooling, or automation patterns. Skip generic spam, empty forks, and unrelated repos.
2. **Evidence** — README (or issue body) contains concrete usage: code snippets, install steps, or worked examples.
3. **Activity or signal** — At least one of:
   - Commit or update within last 90 days
   - Stars ≥ 50 (repos)
   - Maintainer responds to issues (for discussions)
4. **Not duplicate** — `id` not in ledger

Reject: fork-without-changes, tutorial-only repos with no actionable patterns, deprecated/archived with no migration path.

### 4. Build ledger entries

For each accepted new item, append to `items[]`:

```json
{
  "id": "owner/repo",
  "type": "repo",
  "url": "https://github.com/owner/repo",
  "title": "repo-name",
  "summary": "One sentence: why this is useful for AI agent development",
  "topics": ["cursor-skills", "mcp"],
  "first_seen": "YYYY-MM-DD",
  "last_seen": "YYYY-MM-DD",
  "content_hash": "sha256:<64-char-hex>",
  "status": "pending_review",
  "scores": null,
  "supersedes": null,
  "duplicate_of": null,
  "stars": 123
}
```

**content_hash:** SHA-256 of the `summary` string, prefixed with `sha256:`. Use `scripts/validate-ledger.ts` export or compute inline.

**topics** — pick from: `cursor-skills`, `cursor-rules`, `mcp`, `automation`, `agent-framework`, `prompting`, `evaluation`, `github-actions`, `sdk`, `awesome-list`, `discussion`.

### 5. Write daily report

Create `reports/YYYY-MM-DD.md` (today's date in **UTC**). Follow `reports/TEMPLATE.md`.

**Incremental only:** Include **today's new items** in the body. Do not copy the full ledger. Summary stats:

- New items count
- Skipped duplicates count
- Queries run (list the 5 queries used)

Group sections: New Repos, New Skills/Rules/MCP, Notable Issues/Discussions, Pending Review (list new IDs).

**Never edit past report files.**

### 6. Commit

If new items were added or report was written:

```
chore(collector): daily digest YYYY-MM-DD
```

Stage only: `data/seen-items.json`, `reports/YYYY-MM-DD.md`.

If zero new items, still write a minimal report noting "No new items today" and commit it.

## Content hash helper

Run validation after edits:

```bash
npm run validate-ledger
```

## Error handling

- **MCP auth failure** — Stop and report; do not write partial ledger without user-visible error in report.
- **Partial search failure** — Continue with successful queries; note failures in report Summary.
- **Invalid JSON** — Fix ledger before append; run validate-ledger.

## Handoff to Evaluator

All new items use `status: "pending_review"`. The Evaluator Agent (Phase 2) reads these and sets `promoted`, `duplicate_of`, or `archived`. Collector never changes status except on content updates (keep status, update hash/changelog).
