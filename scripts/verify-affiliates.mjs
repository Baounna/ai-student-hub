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
console.log(`Well-formed links: ${validRows.length}/5`);

// "Valid" used to mean only "parses as an https URL", and the script then
// printed "Affiliate configuration looks good" over five links that could never
// pay a penny: they were plain homepage URLs carrying utm_* analytics tags and
// no referral ID of ours. A check that reports success for something that
// cannot work is worse than no check, because it stops anyone looking.
//
// A real affiliate link carries an identifier issued to the publisher, so look
// for one. utm_* deliberately does not count: it is the destination's own
// analytics label and attributes nothing to us.
const REFERRAL_HINTS = ["ref", "refcode", "aff", "affiliate", "aff_id", "partner", "pid", "irclickid", "tag", "utm_referrer"];

function hasReferralId(url) {
  try {
    const parsed = new URL(url);
    for (const [key] of parsed.searchParams) {
      const k = key.toLowerCase();
      if (k.startsWith("utm_") && k !== "utm_referrer") continue;
      if (REFERRAL_HINTS.includes(k)) return true;
    }
    // Some networks encode the ID in the path instead of the query.
    return /\/(?:aff|ref|r|go|partner)\/[A-Za-z0-9_-]{4,}/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

const earning = validRows.filter((row) => hasReferralId(row.url));
console.log(`Links that can actually earn: ${earning.length}/${validRows.length}`);

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
} else if (!earning.length) {
  // Not an error: running no affiliate programme is a legitimate state, and the
  // site now says so. It is only a problem when the site claims otherwise.
  console.log("Links are well-formed, but none carry a referral ID, so none can earn.");
  console.log("That is fine while the site says it earns nothing. Check src/config/site.ts");
  console.log("still says so before adding any commission wording back.");
} else if (earning.length < validRows.length) {
  console.log(`${validRows.length - earning.length} link(s) carry no referral ID and cannot earn.`);
} else {
  console.log("Affiliate configuration looks good.");
}
