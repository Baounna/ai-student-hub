#!/usr/bin/env node
/**
 * Find internships the board does not have yet.
 *
 * Every one of the 88 listings was added by a person typing `npm run add:stage`.
 * That is why the board grows slowly while postings die quickly -- fourteen
 * closed in four days once, and nothing was replacing them. This finds
 * candidates so the adding is the only manual part left.
 *
 * It PROPOSES. It never writes to stages.json.
 *
 * That is not timidity, it is the site's one real claim: every link opened and
 * its page read by a person. An agent that publishes straight to the board
 * makes that false the first time it runs. So this produces a review file and
 * a ready-to-paste command per candidate; a human still opens each link, which
 * is the part that cannot be automated without giving up what makes the list
 * worth reading.
 *
 * Nothing is scraped. All four sources are documented public JSON APIs:
 *   Greenhouse       GET  boards-api.greenhouse.io/v1/boards/<board>/jobs
 *   Ashby            GET  api.ashbyhq.com/posting-api/job-board/<board>
 *   SmartRecruiters  GET  api.smartrecruiters.com/v1/companies/<co>/postings
 *   Workday          POST <tenant>.<pod>.myworkdayjobs.com/wday/cxs/.../jobs
 *
 * LinkedIn is deliberately absent. It has no public postings API and scraping it
 * breaks their terms; seventeen listings on the board came from there by hand
 * and will keep coming from there by hand.
 *
 *   npm run find:stages
 *   npm run find:stages -- --limit 60
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SOURCES = path.join(ROOT, "src/content/stage-sources.json");
const STAGES = path.join(ROOT, "src/content/stages.json");
const OUT_DIR = path.join(ROOT, "docs/agent");
const OUT_MD = path.join(OUT_DIR, "stage-candidates.md");
const OUT_JSON = path.join(OUT_DIR, "stage-candidates.json");

const argv = process.argv.slice(2);
const limitArg = Number.parseInt(argv[argv.indexOf("--limit") + 1] ?? "", 10);
const LIMIT = Number.isFinite(limitArg) && limitArg > 0 ? Math.min(limitArg, 200) : 50;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

/**
 * Two gates, both of which a title must pass.
 *
 * One alone is useless: "intern" alone returns accountants, and "security"
 * alone returns a bank's full-time SOC lead. The board is internships in AI and
 * cyber, so a candidate has to be both.
 */
const IS_INTERNSHIP =
  /\b(intern|internship|stage|stagiaire|alternan(?:ce|t)|apprenti|apprenticeship|working student|werkstudent|praktikum|thesis|master thesis|pfe|co-?op|placement|trainee)\b/i;

const IS_RELEVANT =
  /\b(ai|a\.i\.|artificial intelligence|machine learning|deep learning|ml|mlops|nlp|llm|genai|generative|data scien|data engineer|computer vision|cyber|cybers[ée]curit|security|s[ée]curit|infosec|soc|siem|pentest|penetration|forensic|cryptograph|crypto|malware|threat)\b/i;

/** Seniority words that mean the "intern" in the title was a department name. */
const IS_SENIOR = /\b(senior|staff|principal|lead|director|head of|manager|vp|chief)\b/i;

async function getJson(url, init) {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": UA, Accept: "application/json", ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(25_000)
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return { data: await res.json() };
  } catch (error) {
    return { error: String(error?.message || error).slice(0, 60) };
  }
}

const candidates = [];
const sourceReport = [];

/**
 * ISO code for the country names these APIs return, so the pasted command
 * carries --country rather than leaving every posting defaulted to Morocco.
 * Unknown countries fall through and the person fills it in, which is the right
 * failure: a wrong country is worse on the page than a blank prompt.
 */
const COUNTRY_CODES = {
  france: "FR", morocco: "MA", maroc: "MA", germany: "DE", deutschland: "DE",
  netherlands: "NL", "the netherlands": "NL", belgium: "BE", spain: "ES",
  portugal: "PT", "united kingdom": "GB", uk: "GB", england: "GB",
  "united states": "US", usa: "US", "united states of america": "US",
  canada: "CA", ireland: "IE", italy: "IT", switzerland: "CH", poland: "PL",
  sweden: "SE", luxembourg: "LU", india: "IN", china: "CN", israel: "IL"
};

/**
 * Each API writes a location differently, and none of them documents it.
 * Measured against the real responses:
 *   SmartRecruiters  "Paris, fr"            city first, lower-case ISO code
 *   Greenhouse       "New York, NY"         US state, or a country name
 *   Greenhouse       "San Francisco, CA • New York, NY"   several, bulleted
 *   Workday          "US, CA, Santa Clara"  country FIRST, city last
 *   Workday          "2 Locations"          no location at all
 *
 * Guessing wrong puts a French listing under Morocco on a board whose country
 * filter students use, so anything unrecognised returns blank and the person
 * pasting the command fills it in.
 */
const US_STATES = new Set(
  "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" ")
);

function splitLocation(location) {
  // Several locations in one string: take the first and let the reviewer see
  // the rest in the link.
  const first = String(location || "").split("\u2022")[0];
  const parts = first.split(",").map((p) => p.trim()).filter(Boolean);
  if (!parts.length || /^\d+\s+locations?$/i.test(first.trim())) return { city: "", country: "" };

  const asCountry = (value) => {
    const v = value.toLowerCase();
    if (COUNTRY_CODES[v]) return COUNTRY_CODES[v];
    if (/^[a-z]{2}$/.test(v) && Object.values(COUNTRY_CODES).includes(v.toUpperCase())) {
      return v.toUpperCase();
    }
    return "";
  };

  // Workday leads with the country: "US, CA, Santa Clara".
  const head = asCountry(parts[0]);
  if (head && parts.length > 1) return { city: parts[parts.length - 1], country: head };

  const tail = parts[parts.length - 1];
  const tailCountry = asCountry(tail);
  if (tailCountry) {
    return { city: parts.slice(0, -1).join(", ") || "", country: tailCountry };
  }
  // A US state abbreviation names the country without naming it.
  if (US_STATES.has(tail.toUpperCase()) && parts.length > 1) {
    return { city: parts.slice(0, -1).join(", "), country: "US" };
  }
  return { city: parts.join(", "), country: "" };
}

function consider({ company, role, location, href, source }) {
  if (!role || !href) return;
  if (!IS_INTERNSHIP.test(role)) return;
  if (!IS_RELEVANT.test(role)) return;
  if (IS_SENIOR.test(role) && !/\b(intern|stagiaire|alternan)/i.test(role)) return;
  const { city, country } = splitLocation(location);
  candidates.push({
    company: DISPLAY_NAMES[company] ?? company,
    board: company,
    role: role.trim(),
    location: (location || "").trim(),
    city,
    country,
    href,
    source
  });
}

async function fromGreenhouse(board) {
  const { data, error } = await getJson(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs`);
  if (error || !Array.isArray(data?.jobs)) return { board, error: error ?? "unexpected shape", found: 0 };
  let found = 0;
  for (const job of data.jobs) {
    const before = candidates.length;
    consider({ company: board, role: job.title, location: job.location?.name, href: job.absolute_url, source: "greenhouse" });
    if (candidates.length > before) found += 1;
  }
  return { board, scanned: data.jobs.length, found };
}

async function fromAshby(board) {
  const { data, error } = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${board}`);
  if (error || !Array.isArray(data?.jobs)) return { board, error: error ?? "unexpected shape", found: 0 };
  let found = 0;
  for (const job of data.jobs) {
    const before = candidates.length;
    consider({ company: board, role: job.title, location: job.location, href: job.jobUrl, source: "ashby" });
    if (candidates.length > before) found += 1;
  }
  return { board, scanned: data.jobs.length, found };
}

async function fromSmartRecruiters(company) {
  // One page of 100 is enough: these boards are sorted newest first, and a
  // deeper crawl of a 4,933-posting board to find three internships is rude to
  // an API that is given away for free.
  const { data, error } = await getJson(
    `https://api.smartrecruiters.com/v1/companies/${company}/postings?limit=100`
  );
  if (error || !Array.isArray(data?.content)) return { board: company, error: error ?? "unexpected shape", found: 0 };
  let found = 0;
  for (const job of data.content) {
    const before = candidates.length;
    const city = [job.location?.city, job.location?.country].filter(Boolean).join(", ");
    consider({
      company,
      role: job.name,
      location: city,
      href: `https://jobs.smartrecruiters.com/${company}/${job.id}`,
      source: "smartrecruiters"
    });
    if (candidates.length > before) found += 1;
  }
  return { board: company, scanned: data.content.length, found };
}

async function fromWorkday({ tenant, pod, site }) {
  // searchText does the first cut server-side, which is the difference between
  // reading 1,055 postings and reading 60.
  let scanned = 0;
  let found = 0;
  for (const term of ["intern", "stage", "working student"]) {
    const { data, error } = await getJson(
      `https://${tenant}.${pod}.myworkdayjobs.com/wday/cxs/${tenant}/${site}/jobs`,
      {
        method: "POST",
        // Workday answers 500 without this. Not 400, not a message naming the
        // missing header -- a plain 500, which read as "the board is down" and
        // silently returned nothing from all four tenants.
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: term })
      }
    );
    if (error || !Array.isArray(data?.jobPostings)) continue;
    scanned += data.jobPostings.length;
    for (const job of data.jobPostings) {
      const before = candidates.length;
      consider({
        company: tenant,
        role: job.title,
        location: job.locationsText,
        href: `https://${tenant}.${pod}.myworkdayjobs.com/en-US/${site}${job.externalPath}`,
        source: "workday"
      });
      if (candidates.length > before) found += 1;
    }
  }
  return { board: tenant, scanned, found };
}

const sources = JSON.parse(await fs.readFile(SOURCES, "utf8"));
const DISPLAY_NAMES = sources.displayNames ?? {};
const stages = JSON.parse(await fs.readFile(STAGES, "utf8"));

console.log(`\n  Searching ${
  (sources.greenhouse?.length ?? 0) +
  (sources.ashby?.length ?? 0) +
  (sources.smartrecruiters?.length ?? 0) +
  (sources.workday?.length ?? 0)
} employer boards.\n`);

for (const board of sources.greenhouse ?? []) sourceReport.push(await fromGreenhouse(board));
for (const board of sources.ashby ?? []) sourceReport.push(await fromAshby(board));
for (const board of sources.smartrecruiters ?? []) sourceReport.push(await fromSmartRecruiters(board));
for (const board of sources.workday ?? []) sourceReport.push(await fromWorkday(board));

for (const r of sourceReport) {
  const detail = r.error ? `unreachable — ${r.error}` : `${r.found} of ${r.scanned}`;
  console.log(`  ${String(r.board).padEnd(20)} ${detail}`);
}

/**
 * Already on the board, by link or by the pair that identifies a posting.
 *
 * Href alone misses a job re-posted under a new requisition id, which is common
 * enough that the same Bosch thesis would arrive every week forever.
 */
const seenHref = new Set(stages.items.map((i) => i.href));
const seenPair = new Set(stages.items.map((i) => `${i.company}|${i.role}`.toLowerCase()));
const fresh = candidates.filter(
  (c) => !seenHref.has(c.href) && !seenPair.has(`${c.company}|${c.role}`.toLowerCase())
);

const unique = [];
const seenNew = new Set();
for (const c of fresh) {
  if (seenNew.has(c.href)) continue;
  seenNew.add(c.href);
  unique.push(c);
}
const picked = unique.slice(0, LIMIT);

const today = new Date().toISOString().slice(0, 10);
const shellQuote = (v) => `'${String(v).replace(/'/g, "'\\''")}'`;

const lines = [
  `# Internship candidates — ${today}`,
  "",
  `${picked.length} posting${picked.length === 1 ? "" : "s"} that match internship + AI/cyber and are not on the board yet.`,
  "",
  "**Open each link before adding it.** That is the one step this agent does not do,",
  "and it is the reason the board is worth reading: the site tells a student every",
  "link was opened and its page read by a person. Nothing here has been.",
  "",
  "Copy the command under any posting you want to keep.",
  ""
];

for (const c of picked) {
  lines.push(`### ${c.role}`);
  lines.push(`${c.company} · ${c.location || "location not stated"} · via ${c.source}`);
  lines.push("");
  lines.push(`<${c.href}>`);
  lines.push("");
  lines.push("```");
  lines.push(
    `npm run add:stage -- --role ${shellQuote(c.role)} --company ${shellQuote(c.company)} ` +
      `--city ${shellQuote(c.city)}${c.country ? ` --country ${c.country}` : ""} ` +
      `--deadline rolling --link ${shellQuote(c.href)}`
  );
  lines.push("```");
  lines.push("");
}

if (!picked.length) {
  lines.push("_Nothing new this run. Every matching posting on these boards is already listed._");
  lines.push("");
}

await fs.mkdir(OUT_DIR, { recursive: true });
await fs.writeFile(OUT_MD, `${lines.join("\n")}\n`);
await fs.writeFile(
  OUT_JSON,
  `${JSON.stringify({ generatedAt: today, boards: sourceReport, candidates: picked }, null, 2)}\n`
);

console.log(`\n  ${candidates.length} matched · ${unique.length} not already listed · ${picked.length} written`);
console.log(`  ${path.relative(ROOT, OUT_MD)}`);
console.log(`\n  Open each link, then paste the command under the ones worth keeping.\n`);
