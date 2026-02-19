#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const envFiles = [".env.local", ".env"];

const PLACEHOLDER_HOSTS = new Set([
  "example.com",
  "www.example.com",
  "example.org",
  "www.example.org",
  "your-domain.com",
  "www.your-domain.com"
]);
const PLACEHOLDER_FRAGMENTS = ["your-link", "placeholder", "replace-me", "changeme", "your-domain"];
const REQUIRED_PLACEMENTS = ["home", "resources", "blog", "comparison"];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex < 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) entries[key] = value;
  }

  return entries;
}

function readEnv() {
  const merged = {};
  for (const envFile of envFiles) {
    const fullPath = path.join(cwd, envFile);
    Object.assign(merged, parseEnvFile(fullPath));
  }
  return { ...merged, ...process.env };
}

function isSafeHttpUrl(value) {
  if (!value) return false;
  const normalized = value.trim();
  if (!normalized) return false;
  const lowered = normalized.toLowerCase();
  if (PLACEHOLDER_FRAGMENTS.some((fragment) => lowered.includes(fragment))) return false;

  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (PLACEHOLDER_HOSTS.has(parsed.hostname.toLowerCase())) return false;
  return true;
}

function placementMatches(placement, target) {
  if (!placement) return false;
  const normalized = placement.toLowerCase();
  if (target === "comparison") return normalized.includes("comparison") || normalized.includes("compare");
  return normalized.includes(target);
}

const env = readEnv();
const rows = [];

for (let index = 1; index <= 5; index += 1) {
  const name = (env[`AFFILIATE_${index}_NAME`] || "").trim();
  const url = (env[`AFFILIATE_${index}_URL`] || "").trim();
  const placement = (env[`AFFILIATE_${index}_PLACEMENT`] || "").trim();
  const valid = Boolean(name) && isSafeHttpUrl(url);

  rows.push({
    index,
    name,
    url,
    placement,
    valid
  });
}

const validRows = rows.filter((row) => row.valid);

console.log("Affiliate configuration check");
console.log("--------------------------------");
for (const row of rows) {
  const status = row.valid ? "OK" : "INVALID";
  const summary = row.name ? row.name : "(missing name)";
  const placement = row.placement || "(missing placement)";
  console.log(`#${row.index} ${status} | ${summary} | ${placement}`);
}

console.log("--------------------------------");
console.log(`Valid links: ${validRows.length}/5`);

let hasError = false;
if (!validRows.length) {
  console.error("No valid affiliate links found.");
  hasError = true;
}

for (const target of REQUIRED_PLACEMENTS) {
  const covered = validRows.some((row) => placementMatches(row.placement, target));
  if (!covered) {
    console.error(`Missing placement coverage: ${target}`);
    hasError = true;
  }
}

if (hasError) {
  process.exitCode = 1;
} else {
  console.log("Affiliate configuration looks good.");
}
