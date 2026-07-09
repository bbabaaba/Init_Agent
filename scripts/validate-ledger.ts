#!/usr/bin/env npx tsx
/**
 * Validates data/seen-items.json against ledger schema rules
 * and checks for duplicate IDs, hash integrity, and referential links.
 */

import { readFileSync } from "fs";
import { createHash } from "crypto";
import { join, dirname, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LEDGER_PATH = join(ROOT, "data", "seen-items.json");

const VALID_STATUSES = new Set([
  "pending_review",
  "promoted",
  "archived",
  "duplicate_of",
]);
const VALID_TYPES = new Set(["repo", "issue", "discussion", "skill_file"]);
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface Ledger {
  version: number;
  items: LedgerItem[];
}

interface LedgerItem {
  id: string;
  type: string;
  url: string;
  title: string;
  summary: string;
  topics: string[];
  first_seen: string;
  last_seen: string;
  content_hash: string;
  status: string;
  scores?: Scores | null;
  supersedes?: string | null;
  duplicate_of?: string | null;
  stars?: number;
  changelog?: ChangelogEntry[];
}

interface Scores {
  solidness: number;
  novelty: number;
  maintenance: number;
  community: number;
  composite: number;
  evaluated_at?: string;
  notes?: string;
}

interface ChangelogEntry {
  date: string;
  content_hash: string;
  note: string;
}

function isScore(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 10;
}

function validateScores(scores: unknown, prefix: string): string[] {
  const errors: string[] = [];
  if (scores === null || scores === undefined) return errors;
  if (typeof scores !== "object" || Array.isArray(scores)) {
    errors.push(`${prefix}: scores must be object or null`);
    return errors;
  }
  const s = scores as Record<string, unknown>;
  for (const key of ["solidness", "novelty", "maintenance", "community", "composite"] as const) {
    if (!isScore(s[key])) errors.push(`${prefix}.scores: invalid ${key}`);
  }
  if (s.evaluated_at !== undefined && !DATE_PATTERN.test(String(s.evaluated_at))) {
    errors.push(`${prefix}.scores: invalid evaluated_at`);
  }
  if (s.notes !== undefined && typeof s.notes !== "string") {
    errors.push(`${prefix}.scores: notes must be string`);
  }
  return errors;
}

function validateChangelog(changelog: unknown, prefix: string): string[] {
  const errors: string[] = [];
  if (changelog === undefined) return errors;
  if (!Array.isArray(changelog)) {
    errors.push(`${prefix}: changelog must be an array`);
    return errors;
  }
  changelog.forEach((entry, i) => {
    const p = `${prefix}.changelog[${i}]`;
    if (!entry || typeof entry !== "object") {
      errors.push(`${p}: must be object`);
      return;
    }
    const e = entry as ChangelogEntry;
    if (!DATE_PATTERN.test(e.date ?? "")) errors.push(`${p}: invalid date`);
    if (!HASH_PATTERN.test(e.content_hash ?? "")) errors.push(`${p}: invalid content_hash`);
    if (!e.note?.trim()) errors.push(`${p}: missing note`);
  });
  return errors;
}

function validateItem(item: LedgerItem, index: number, ids: Set<string>): string[] {
  const errors: string[] = [];
  const prefix = `items[${index}]`;

  if (!item.id) errors.push(`${prefix}: missing id`);
  else if (ids.has(item.id)) errors.push(`${prefix}: duplicate id "${item.id}"`);
  else ids.add(item.id);

  if (!VALID_TYPES.has(item.type)) errors.push(`${prefix}: invalid type "${item.type}"`);
  if (!VALID_STATUSES.has(item.status)) errors.push(`${prefix}: invalid status "${item.status}"`);
  if (!item.url?.startsWith("http")) errors.push(`${prefix}: invalid url`);
  if (!item.title?.trim()) errors.push(`${prefix}: missing title`);
  if (!item.summary?.trim()) errors.push(`${prefix}: missing summary`);
  if (!Array.isArray(item.topics) || item.topics.length === 0) {
    errors.push(`${prefix}: topics must be non-empty array`);
  }
  if (!DATE_PATTERN.test(item.first_seen ?? "")) errors.push(`${prefix}: invalid first_seen`);
  if (!DATE_PATTERN.test(item.last_seen ?? "")) errors.push(`${prefix}: invalid last_seen`);
  if (
    DATE_PATTERN.test(item.first_seen ?? "") &&
    DATE_PATTERN.test(item.last_seen ?? "") &&
    item.first_seen > item.last_seen
  ) {
    errors.push(`${prefix}: first_seen must be <= last_seen`);
  }
  if (!HASH_PATTERN.test(item.content_hash ?? "")) {
    errors.push(`${prefix}: invalid content_hash`);
  } else if (item.summary?.trim() && item.content_hash !== hashSummary(item.summary)) {
    errors.push(`${prefix}: content_hash does not match summary`);
  }
  if (item.stars !== undefined) {
    if (typeof item.stars !== "number" || !Number.isInteger(item.stars) || item.stars < 0) {
      errors.push(`${prefix}: stars must be a non-negative integer`);
    }
  }

  errors.push(...validateScores(item.scores, prefix));
  errors.push(...validateChangelog(item.changelog, prefix));

  return errors;
}

function validateReferences(items: LedgerItem[]): string[] {
  const errors: string[] = [];
  const ids = new Set(items.map((i) => i.id).filter(Boolean));

  items.forEach((item, index) => {
    const prefix = `items[${index}]`;

    if (item.status === "duplicate_of") {
      if (!item.duplicate_of) {
        errors.push(`${prefix}: status duplicate_of requires duplicate_of id`);
      }
    }

    if (item.duplicate_of) {
      if (!ids.has(item.duplicate_of)) {
        errors.push(`${prefix}: duplicate_of "${item.duplicate_of}" not found`);
      } else if (item.duplicate_of === item.id) {
        errors.push(`${prefix}: duplicate_of cannot reference self`);
      }
    }

    if (item.supersedes) {
      if (!ids.has(item.supersedes)) {
        errors.push(`${prefix}: supersedes "${item.supersedes}" not found`);
      } else if (item.supersedes === item.id) {
        errors.push(`${prefix}: supersedes cannot reference self`);
      }
    }
  });

  return errors;
}

export function hashSummary(summary: string): string {
  const digest = createHash("sha256").update(summary.trim()).digest("hex");
  return `sha256:${digest}`;
}

function main(): void {
  const raw = readFileSync(LEDGER_PATH, "utf-8");
  let ledger: Ledger;
  try {
    ledger = JSON.parse(raw) as Ledger;
  } catch {
    console.error("FAIL: invalid JSON in seen-items.json");
    process.exit(1);
  }

  if (ledger.version !== 1) {
    console.error(`FAIL: unsupported version ${ledger.version}`);
    process.exit(1);
  }

  if (!Array.isArray(ledger.items)) {
    console.error("FAIL: items must be an array");
    process.exit(1);
  }

  const ids = new Set<string>();
  const errors = [
    ...ledger.items.flatMap((item, i) => validateItem(item, i, ids)),
    ...validateReferences(ledger.items),
  ];

  if (errors.length > 0) {
    console.error("FAIL: ledger validation errors:");
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(`OK: ${ledger.items.length} item(s), no duplicate IDs`);
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  // Compare file URLs so importing hashSummary does not run validation.
  return import.meta.url === pathToFileURL(resolve(entry)).href;
}

if (isMainModule()) {
  main();
}
