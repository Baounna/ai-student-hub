#!/usr/bin/env node
/**
 * Tell search engines the site exists, without an account.
 *
 * IndexNow is a protocol Bing, Yandex, Seznam and Naver all accept: host a key
 * file at the site root to prove you control the domain, then POST a list of
 * URLs. No console, no verification email, no ownership flow — which is what
 * makes it usable from CI.
 *
 * It does not cover Google. Google only accepts URLs through Search Console,
 * which needs a human to sign in once; see docs/OPERATIONS.md. This gets the
 * site into every other major index in the meantime.
 *
 * Reads the deployed sitemap rather than a local list, so it submits exactly
 * what is live.
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { loadScriptEnv } from "./lib/load-env.mjs";

loadScriptEnv(process.cwd());

const execFileAsync = promisify(execFile);

const SITE = (process.env.INDEXNOW_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://ai-student-hub-navy.vercel.app")
  .trim()
  .replace(/\/+$/, "");

// IndexNow caps a single submission at 10,000 URLs; we stay well under.
const MAX_URLS = Math.max(1, Math.min(Number.parseInt(process.env.INDEXNOW_MAX_URLS || "1000", 10), 10000));

/** The key is public by design: hosting it at the site root is the ownership proof. */
async function findKey() {
  const explicit = (process.env.INDEXNOW_KEY || "").trim();
  if (explicit) return explicit;

  const publicDir = path.join(process.cwd(), "public");
  const entries = await fs.readdir(publicDir);
  const keyFile = entries.find((name) => /^[0-9a-f]{8,128}\.txt$/i.test(name));
  if (!keyFile) return "";

  const contents = (await fs.readFile(path.join(publicDir, keyFile), "utf8")).trim();
  return contents === path.basename(keyFile, ".txt") ? contents : "";
}

async function fetchSitemapUrls() {
  const { stdout } = await execFileAsync("curl", ["-sL", "--max-time", "30", `${SITE}/sitemap.xml`], {
    maxBuffer: 24 * 1024 * 1024
  });
  return [...String(stdout).matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim())
    .filter((u) => u.startsWith(SITE));
}

async function run() {
  console.log(`IndexNow — ${SITE}`);
  console.log("--------------------------------");

  const key = await findKey();
  if (!key) {
    // Not a failure: a site without a key file simply has not opted in.
    console.log("No IndexNow key file found in public/. Nothing to submit.");
    return;
  }

  const keyLocation = `${SITE}/${key}.txt`;

  // Refuse to submit if the proof is not actually reachable, since the endpoint
  // would reject the batch anyway and the error is clearer from here.
  // curl exits non-zero on DNS or connection failure, which would throw here;
  // an unreachable host is a reportable state, not a crash.
  let keyStatus = "000";
  try {
    const { stdout } = await execFileAsync("curl", [
      "-sL", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "20", keyLocation
    ]);
    keyStatus = stdout.trim();
  } catch {
    keyStatus = "000";
  }

  if (keyStatus !== "200") {
    const reason = keyStatus === "000" ? "host unreachable" : `HTTP ${keyStatus}`;
    console.log(`Key file is not reachable at ${keyLocation} (${reason}).`);
    console.log("It ships from public/, so it appears after the next deploy.");
    process.exitCode = 1;
    return;
  }
  console.log(`Key verified at ${keyLocation}`);

  const urls = (await fetchSitemapUrls()).slice(0, MAX_URLS);
  if (!urls.length) {
    console.log("Sitemap returned no URLs for this host.");
    process.exitCode = 1;
    return;
  }

  const body = JSON.stringify({ host: new URL(SITE).host, key, keyLocation, urlList: urls });
  const { stdout: status } = await execFileAsync("curl", [
    "-s", "-o", "/dev/null", "-w", "%{http_code}",
    "-X", "POST", "https://api.indexnow.org/indexnow",
    "-H", "Content-Type: application/json; charset=utf-8",
    "--max-time", "45",
    "-d", body
  ], { maxBuffer: 24 * 1024 * 1024 });

  const code = status.trim();
  console.log("--------------------------------");
  // 200 accepted, 202 accepted pending key validation.
  if (code === "200" || code === "202") {
    console.log(`Submitted ${urls.length} URLs. HTTP ${code}.`);
    return;
  }

  // 422 usually means the URLs do not match the host that owns the key.
  console.log(`Submission rejected with HTTP ${code}.`);
  process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
