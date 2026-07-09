# GitHub Search Query Rotation

Use **5 queries per run**. Rotate by `dayOfYear % 4` to cycle through groups fairly.

## Group 0 — Cursor & Agent Skills

```
cursor skills SKILL.md in:readme
agent skills path:.cursor/skills
cursor rules mcp in:readme stars:>20
awesome cursor agent
.cursor/skills extension:md
```

## Group 1 — MCP & Automation

```
mcp server github ai stars:>30
modelcontextprotocol server language:typescript
cursor automation agent
github actions cursor agent
mcp tools llm in:readme
```

## Group 2 — Frameworks & SDKs

```
llm agent framework stars:>100 pushed:>2025-01-01
cursor sdk agent typescript
ai agent orchestration mcp
langgraph cursor in:readme
agent workflow github actions ai
```

## Group 3 — Trending & Discussions

```
cursor OR "ai agent" stars:>50 pushed:>2025-06-01
agent skills repo updated:>2025-06-01
mcp server pushed:>2025-06-01 stars:>20
topic:cursor stars:>10
topic:mcp stars:>10
```

## Issue / discussion queries (optional swap slot)

When a group query under-fills results, **swap** one repo query (still within the 5-query cap) for:

```
"cursor agent" is:issue state:open
"cursor skills" OR "agent skills" is:issue comments:>3
model context protocol best practices is:discussion
```

Use `gh search issues` / GitHub issues MCP for these — not `gh search repos`.

## gh CLI equivalents

```bash
gh search repos "cursor skills SKILL.md in:readme" --sort updated --limit 20
gh search repos "mcp server ai stars:>30" --sort stars --limit 20
gh search issues "\"cursor agent\" is:issue state:open" --sort updated --limit 10
```

## Query selection algorithm

1. `groupIndex = dayOfYear % 4` (0–3)
2. Take first 5 queries from that group (hard cap: **5 queries per run**)
3. If `< 10` unique candidates after dedup, **replace** one under-filling repo query with either:
   - 1 query from `(groupIndex + 1) % 4`, or
   - an optional issue/discussion query from the swap-slot list above
4. Never exceed 5 total queries — swap, do not add
