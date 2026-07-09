---
name: ai-skills-evaluator
description: >-
  Phase 2 evaluator agent. Scores pending_review items in data/seen-items.json
  against promoted peers on solidness, novelty, maintenance, and community signal.
  Updates status to promoted, duplicate_of, or archived. Use weekly or on manual
  /evaluate request. Not enabled in daily automation until Phase 1 is stable.
disable-model-invocation: true
---

# AI Skills Evaluator

Judge whether new discoveries are **better or more solid** than existing promoted items. Operates on ledger items with `status: "pending_review"`.

## Files

| File | Purpose |
|------|---------|
| `data/seen-items.json` | Read pending items; write scores and status |
| `scoring-rubric.md` | Dimension definitions and thresholds |
| `reports/evaluations/` | Weekly evaluation digests |

## When to run

- **Weekly automation** (Phase 2): Mondays 10:00 — see the Phase 2 section in `automations/daily-collector.md`
- **Manual:** User asks to evaluate pending items

## Run procedure

### 1. Load pending items

Read `data/seen-items.json`. Filter `items` where `status === "pending_review"`.

If none, write `reports/evaluations/YYYY-MM-DD.md` noting "No pending items" and exit.

### 2. Load promoted peers

Build topic clusters from items where `status === "promoted"`. Group by overlapping `topics[]` (≥1 shared topic = same cluster).

### 3. Deep fetch (GitHub MCP)

For each pending item, fetch via GitHub MCP (or `gh repo view`, `gh issue view`):

- README quality, examples, install steps
- Last commit date, open issues, release tags
- Stars, forks, contributor count

### 4. Score each dimension (0–10)

See [scoring-rubric.md](scoring-rubric.md) for detailed criteria.

| Dimension | Weight |
|-----------|--------|
| solidness | 0.35 |
| novelty | 0.25 |
| maintenance | 0.20 |
| community | 0.20 |

**composite** = weighted sum, rounded to 1 decimal.

### 5. Compare to cluster peers

For each pending item, find the **closest promoted peer** in the same topic cluster (highest topic overlap).

**Decision rules:**

| Outcome | Condition |
|---------|-----------|
| `promoted` | composite ≥ 7.0 AND beats closest peer by ≥ 1.5 |
| `duplicate_of` | Same cluster AND composite ≤ peer.composite − 2.0 |
| `archived` | composite < 4.0 OR no commits in 180 days AND stars < 20 |
| stay `pending_review` | Borderline (composite 5–7, unclear vs peer) — note in report for human review |

When `promoted` and clearly replaces a peer: set `supersedes` to the peer's `id` (peer stays promoted until manually archived).

When `duplicate_of`: set `duplicate_of` to the peer's `id`.

### 6. Update ledger

For each evaluated item, write:

```json
{
  "status": "promoted",
  "scores": {
    "solidness": 8,
    "novelty": 7,
    "maintenance": 6,
    "community": 7,
    "composite": 7.2,
    "evaluated_at": "YYYY-MM-DD",
    "notes": "Brief rationale"
  },
  "supersedes": null,
  "duplicate_of": null
}
```

Never delete rows. Never change `first_seen` or `id`.

### 7. Write evaluation report

Create `reports/evaluations/YYYY-MM-DD.md`:

```markdown
# AI Skills Evaluation — YYYY-MM-DD

## Summary
- Evaluated: N
- Promoted: N
- Duplicate of existing: N
- Archived: N
- Still pending review: N

## Promoted
| ID | Composite | vs Peer | Notes |
|----|-----------|---------|-------|

## Supersedes relationships
- new-id supersedes old-id — reason

## Archived / Duplicates
...
```

### 8. Commit

```
chore(evaluator): weekly evaluation YYYY-MM-DD
```

Stage: `data/seen-items.json`, `reports/evaluations/YYYY-MM-DD.md`.

## Boundaries

- Evaluator does **not** search GitHub for new repos — that's the Collector's job.
- Evaluator does **not** edit daily reports in `reports/YYYY-MM-DD.md`.
- Collector never sets `promoted` — only Evaluator promotes.

## Phase 2 status

This skill is scaffolded but **not wired to automation** until the daily Collector has run successfully for at least one week. Enable via second Cursor Automation when ready.
