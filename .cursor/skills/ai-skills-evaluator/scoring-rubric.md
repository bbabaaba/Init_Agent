# Scoring Rubric — AI Skills Evaluator

Each dimension scored 0–10. Be consistent across runs; document edge cases in `scores.notes`.

## Solidness (weight 0.35)

Reproducible, actionable content with working examples.

| Score | Criteria |
|-------|----------|
| 9–10 | Complete install + usage docs, tested examples, clear prerequisites, production-ready patterns |
| 7–8 | Good README with copy-paste examples; minor gaps |
| 5–6 | Conceptual docs only; examples incomplete or outdated |
| 3–4 | Vague marketing; no concrete steps |
| 0–2 | Broken links, empty repo, or misleading claims |

**Signals:** README code blocks, `SKILL.md` structure, MCP config samples, CI passing (if visible).

## Novelty (weight 0.25)

Not redundant with promoted items in the same topic cluster.

| Score | Criteria |
|-------|----------|
| 9–10 | Unique approach or fills clear gap; no promoted peer covers this |
| 7–8 | Meaningful variation on existing patterns |
| 5–6 | Incremental improvement over known solutions |
| 3–4 | Mostly overlaps with promoted peer |
| 0–2 | Near-identical fork or repackaged content |

**Compare against:** Closest promoted item in shared topic cluster. If no peer in cluster, score novelty ≥ 7 by default unless clearly derivative of well-known project.

## Maintenance (weight 0.20)

Project health and ongoing care.

| Score | Criteria |
|-------|----------|
| 9–10 | Commits in last 30 days; issues triaged; tagged releases |
| 7–8 | Active within 90 days; maintainer responds |
| 5–6 | Sporadic updates; some open issues stale |
| 3–4 | No commits 90–180 days |
| 0–2 | Abandoned >180 days or explicitly archived without replacement |

**Signals:** `pushedAt`, issue close rate, release tags, "deprecated" in README.

## Community (weight 0.20)

Normalized social proof (adjust for niche vs. mainstream topics).

| Score | Criteria |
|-------|----------|
| 9–10 | Stars >1000 OR multiple contributors + active discussions |
| 7–8 | Stars 100–1000 OR strong issue engagement |
| 5–6 | Stars 20–100 |
| 3–4 | Stars 5–20 |
| 0–2 | Stars <5 and no engagement |

**Niche adjustment:** For `cursor-skills` / `mcp` topics, divide star thresholds by 2 (50 stars ≈ 7 for niche).

## Composite score

```
composite = 0.35 * solidness + 0.25 * novelty + 0.20 * maintenance + 0.20 * community
```

Round to 1 decimal place.

## Promotion thresholds

| Rule | Threshold |
|------|-----------|
| Minimum for promotion | composite ≥ 7.0 |
| Beat closest peer | composite ≥ peer.composite + 1.5 |
| Mark duplicate | same cluster AND composite ≤ peer.composite − 2.0 |
| Archive | composite < 4.0 OR (no activity 180d AND stars < 20) |

## Borderline handling

If composite is 5.0–6.9 and peer comparison is unclear:

- Keep `status: pending_review`
- Add detailed `scores.notes` explaining what's missing
- List in evaluation report under "Needs human review"

## Topic clusters

Items share a cluster if they have ≥1 common topic tag. Primary clusters:

- `cursor-skills` + `cursor-rules`
- `mcp` + `automation`
- `agent-framework` + `sdk`
- `awesome-list` (compare within list category only)

When comparing repos to issues/discussions, only compare within same `type` unless the issue documents a clearly superior approach to a repo pattern.
