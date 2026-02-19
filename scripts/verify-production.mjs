#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const envFiles = [".env.local", ".env"];
const PLACEHOLDER_HOSTS = new Set(["example.com", "www.example.com", "your-domain.com", "www.your-domain.com"]);
const PLACEHOLDER_FRAGMENTS = ["placeholder", "replace-me", "your-domain", "your-link", "changeme"];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 0) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }

  return out;
}

function readEnv() {
  const merged = {};
  for (const envFile of envFiles) {
    const fullPath = path.join(cwd, envFile);
    Object.assign(merged, parseEnvFile(fullPath));
  }
  return { ...merged, ...process.env };
}

function isEmail(value) {
  return /^\S+@\S+\.\S+$/.test((value || "").trim());
}

function isUrl(value) {
  const raw = (value || "").trim();
  if (!raw) return false;
  if (PLACEHOLDER_FRAGMENTS.some((fragment) => raw.toLowerCase().includes(fragment))) return false;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (PLACEHOLDER_HOSTS.has(parsed.hostname.toLowerCase())) return false;
    return true;
  } catch {
    return false;
  }
}

function boolish(value) {
  return ["1", "true", "yes"].includes((value || "").trim().toLowerCase());
}

function printCheck(type, message) {
  const icon = type === "ERROR" ? "✖" : type === "WARN" ? "▲" : "✔";
  console.log(`${icon} [${type}] ${message}`);
}

const env = readEnv();
let errors = 0;
let warns = 0;

function ok(message) {
  printCheck("OK", message);
}

function warn(message) {
  warns += 1;
  printCheck("WARN", message);
}

function error(message) {
  errors += 1;
  printCheck("ERROR", message);
}

console.log("AI Student Hub production preflight");
console.log("-----------------------------------");

const siteUrl = (env.NEXT_PUBLIC_SITE_URL || env.SITE_URL || "").trim();
if (!isUrl(siteUrl)) {
  error("Set NEXT_PUBLIC_SITE_URL or SITE_URL to a valid production URL.");
} else {
  ok(`Site URL set: ${siteUrl}`);
}

const authSecret = (env.AUTH_SESSION_SECRET || "").trim();
if (!authSecret || authSecret === "change-this-in-production" || authSecret.length < 32) {
  error("AUTH_SESSION_SECRET must be set with at least 32 characters.");
} else {
  ok("AUTH_SESSION_SECRET looks strong.");
}

const contactEmail = (env.NEXT_PUBLIC_CONTACT_EMAIL || "").trim();
if (!isEmail(contactEmail)) {
  error("NEXT_PUBLIC_CONTACT_EMAIL is missing or invalid.");
} else {
  ok(`Contact email set: ${contactEmail}`);
}

const legalName = (env.NEXT_PUBLIC_LEGAL_NAME || "").trim();
if (!legalName) {
  error("NEXT_PUBLIC_LEGAL_NAME is required.");
} else {
  ok("Legal name set.");
}

const linkedinUrl = (env.NEXT_PUBLIC_LINKEDIN_URL || "").trim();
if (!isUrl(linkedinUrl)) {
  warn("NEXT_PUBLIC_LINKEDIN_URL is missing or invalid.");
} else {
  ok("LinkedIn URL set.");
}

const leadEn = (env.NEXT_PUBLIC_LEAD_MAGNET_URL_EN || "").trim();
const leadFr = (env.NEXT_PUBLIC_LEAD_MAGNET_URL_FR || "").trim();
if (!leadEn || !leadFr) {
  warn("Lead magnet URLs are missing (NEXT_PUBLIC_LEAD_MAGNET_URL_EN/FR).");
} else {
  ok("Lead magnet URLs set.");
}

const checkout = (env.NEXT_PUBLIC_PRODUCT_CHECKOUT_URL || "").trim();
if (!isUrl(checkout)) {
  warn("NEXT_PUBLIC_PRODUCT_CHECKOUT_URL not set. Product page will show fallback CTA.");
} else {
  ok("Product checkout URL set.");
}

const oauthMode = ((env.OAUTH_MODE || "disable").trim().toLowerCase() || "disable");
if (oauthMode === "enable") {
  const providers = [
    ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "Google"],
    ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GitHub"],
    ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "LinkedIn"]
  ];
  const configuredCount = providers.filter(([idKey, secretKey]) => (env[idKey] || "").trim() && (env[secretKey] || "").trim()).length;
  if (!configuredCount) {
    error("OAUTH_MODE=enable but no provider keys are fully configured.");
  } else {
    ok(`OAuth enabled with ${configuredCount} configured provider(s).`);
  }
} else {
  warn("OAuth is disabled. Only email/local access flow is available.");
}

const emailProvider = ((env.EMAIL_PROVIDER || "none").trim().toLowerCase() || "none");
if (emailProvider === "convertkit") {
  if (!(env.CONVERTKIT_FORM_ID || "").trim() || !(env.CONVERTKIT_API_KEY || "").trim()) {
    error("EMAIL_PROVIDER=convertkit requires CONVERTKIT_FORM_ID and CONVERTKIT_API_KEY.");
  } else {
    ok("ConvertKit configuration is set.");
  }
} else {
  warn("EMAIL_PROVIDER is none. Newsletter/auth forms will not deliver emails.");
}

const analyticsMode = ((env.ANALYTICS_MODE || "none").trim().toLowerCase() || "none");
if (analyticsMode === "ga4") {
  if (!(env.GA4_MEASUREMENT_ID || "").trim()) {
    error("ANALYTICS_MODE=ga4 requires GA4_MEASUREMENT_ID.");
  } else {
    ok("GA4 measurement id set.");
  }
} else {
  warn("Analytics mode is none. No GA4 traffic insights.");
}

const webhook = (env.TRACKING_WEBHOOK_URL || "").trim();
if (webhook && !isUrl(webhook)) {
  error("TRACKING_WEBHOOK_URL is invalid.");
} else if (webhook) {
  ok("Tracking webhook URL set.");
}

const affiliateRows = [];
for (let i = 1; i <= 5; i += 1) {
  affiliateRows.push({
    i,
    name: (env[`AFFILIATE_${i}_NAME`] || "").trim(),
    url: (env[`AFFILIATE_${i}_URL`] || "").trim(),
    placement: (env[`AFFILIATE_${i}_PLACEMENT`] || "").trim().toLowerCase()
  });
}

const validAffiliates = affiliateRows.filter((row) => row.name && isUrl(row.url));
if (validAffiliates.length < 3) {
  error("Add at least 3 valid affiliate links (AFFILIATE_1..5).");
} else {
  ok(`Affiliate links configured: ${validAffiliates.length}`);
}

for (const placement of ["home", "resources", "blog", "comparison"]) {
  const covered = validAffiliates.some((row) =>
    placement === "comparison"
      ? row.placement.includes("compare") || row.placement.includes("comparison")
      : row.placement.includes(placement)
  );
  if (!covered) warn(`No affiliate placement covering "${placement}".`);
}

const donationLinks = [
  env.NEXT_PUBLIC_DONATION_PRIMARY_URL,
  env.NEXT_PUBLIC_DONATION_PAYPAL_URL,
  env.NEXT_PUBLIC_DONATION_KOFI_URL,
  env.NEXT_PUBLIC_DONATION_GITHUB_SPONSORS_URL
].filter((value) => isUrl(value || ""));

if (!donationLinks.length) {
  warn("No donation links configured.");
} else {
  ok(`Donation links configured: ${donationLinks.length}`);
}

const legalContact = (env.PRIVACY_CONTACT_EMAIL || "").trim();
if (legalContact && !isEmail(legalContact)) {
  error("PRIVACY_CONTACT_EMAIL is invalid.");
}
if (!((env.AFFILIATE_DISCLOSURE_TEXT_EN || "").trim() && (env.AFFILIATE_DISCLOSURE_TEXT_FR || "").trim())) {
  warn("Affiliate disclosure texts (EN/FR) are not fully set.");
} else {
  ok("Affiliate disclosure texts set.");
}

if (boolish(env.TRACKING_DEBUG) || boolish(env.NEXT_PUBLIC_TRACKING_DEBUG)) {
  warn("Tracking debug is enabled. Disable for production.");
}

console.log("-----------------------------------");
if (errors) {
  console.log(`Preflight failed: ${errors} error(s), ${warns} warning(s).`);
  process.exitCode = 1;
} else {
  console.log(`Preflight passed with ${warns} warning(s).`);
}
