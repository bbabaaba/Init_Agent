#!/usr/bin/env npx tsx
/**
 * Validates data/seen-items.json against data/schema.json structure
 * and checks for duplicate IDs.
 */

import { readFileSync } from "fs";
import { createHash } from "crypto";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

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
  scores?: unknown;
  supersedes?: string | null;
  duplicate_of?: string | null;
  stars?: number;
  changelog?: unknown[];
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
  if (!DATE_PATTERN.test(item.first_seen)) errors.push(`${prefix}: invalid first_seen`);
  if (!DATE_PATTERN.test(item.last_seen)) errors.push(`${prefix}: invalid last_seen`);
  if (!HASH_PATTERN.test(item.content_hash)) errors.push(`${prefix}: invalid content_hash`);

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
  const errors = ledger.items.flatMap((item, i) => validateItem(item, i, ids));

  if (errors.length > 0) {
    console.error("FAIL: ledger validation errors:");
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(`OK: ${ledger.items.length} item(s), no duplicate IDs`);
}

main();
