#!/usr/bin/env node
/**
 * Find internships the board does not have yet.
 *
 * Every one of the 88 listings was added by a person typing `npm run add:stage`.
 * That is why the board grows slowly while postings die quickly -- fourteen
 * closed in four days once, and nothing was replacing them. This finds
 * candidates so the adding is the only manual part left.
 *
 * Without --write it only PROPOSES: a review file and a ready-to-paste command
 * per candidate. With --write it adds what it can stand behind, and the two are
 * not the same set.
 *
 * The line between them is the site's one real claim. Every row says "link
 * checked <date>", and the method note promises the link was fetched and the
 * page read rather than pinged for a status code. So a row is only written
 * after its link has actually been fetched and answered, it carries addedBy
 * feed so the page says on the row where it came from, and anything the fetch
 * could not settle -- a 403, an unresolved country, a page that reads as closed
 * -- stays in the review file for a person. Refusing to guess is the whole
 * difference between this and a scraper.
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
import { pathToFileURL } from "node:url";
import {
  BLOCKED_STATUSES,
  expiredValidThrough,
  gonePhrase,
  listingHost,
  redirectedAway
} from "./check-stages.mjs";
import { visibleText } from "./lib/visible-text.mjs";

const ROOT = process.cwd();
const SOURCES = path.join(ROOT, "src/content/stage-sources.json");
const STAGES = path.join(ROOT, "src/content/stages.json");
const OUT_DIR = path.join(ROOT, "docs/agent");
const OUT_MD = path.join(OUT_DIR, "stage-candidates.md");
const OUT_JSON = path.join(OUT_DIR, "stage-candidates.json");

const argv = process.argv.slice(2);
/**
 * --write adds the candidates to the board.
 *
 * Without it this proposes and a person pastes the commands. With it the agent
 * writes, and the page stops claiming a person read these: each one is stamped
 * addedBy "feed", and /stages says so on the row and in its method note.
 *
 * Only structured employer APIs feed this. The title, company and location are
 * the employer's own fields, and the Monday check re-confirms the posting
 * against the same API — which is a different claim from "somebody clicked it
 * once in September", not a weaker one.
 */
const WRITE = argv.includes("--write");
/**
 * --discover looks for employers the board has never heard of.
 *
 * Without it this polls the twelve boards seeded from stages.json, which is a
 * closed loop: it finds new postings at Celonis and Bosch and can never find a
 * company that is not already listed. The board would only ever deepen, never
 * widen.
 *
 * None of these APIs publishes a directory, but all three answer by name: a
 * board that exists returns 200 and its postings, one that does not returns
 * 404. So a company is a hypothesis and the probe is the test. Confirmed
 * boards are written into stage-sources.json and polled weekly from then on.
 */
const DISCOVER = argv.includes("--discover");
/** A bad regex should cost a handful of wrong rows, not forty. */
const WRITE_CAP = 15;
/**
 * And no more than this from any one employer in a run.
 *
 * The first widened run added fifteen listings of which twelve were Wavestone,
 * because a consultancy with a hundred open internships drowns out nine other
 * employers who have one each. The board already spreads employers when it
 * renders; this stops one of them arriving in bulk in the first place.
 */
const PER_COMPANY_CAP = 2;

/**
 * And a ceiling on how deep any employer may get on the board.
 *
 * A per-run cap bounds one Thursday; it does nothing about an employer
 * accumulating over ten of them. Wavestone is already at 11 of 104 and
 * Capgemini at 10 — and stages-order.test.ts forbids two consecutive rows from
 * the same employer, which stops being satisfiable once one of them holds a
 * large enough share, however the list is spread. That test failing is what
 * stopped the first scheduled run from pushing anything at all.
 *
 * Twelve, because the deepest employer today is eleven and this is meant to
 * stop the agent making the problem worse rather than to re-cut a board a
 * person built by hand.
 */
const MAX_PER_COMPANY_ON_BOARD = 12;

/**
 * Countries this board is for.
 *
 * The first scheduled run tried to add an internship in China, and the tests
 * stopped the whole push because nothing renders a label for CN. Adding that
 * label would have been the wrong fix: a role in Shanghai is no use to a
 * student in Casablanca, and the board's own country filter is the control
 * those readers use. Europe, North Africa and North America is what this list
 * serves, so that is what it collects.
 */
const SERVED_COUNTRIES = new Set([
  "MA", "FR", "BE", "CH", "DE", "ES", "IE", "IT", "LU", "NL",
  "PL", "PT", "SE", "GB", "AT", "DK", "FI", "NO", "CZ", "US", "CA"
]);
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

/** Either gate opens the door; the kind is decided separately in toStage. */
const IS_STUDENT_POSITION = (role) => IS_INTERNSHIP.test(role) || IS_DOCTORAL_POSITION.test(role);

export const IS_RELEVANT =
  /\b(ai|a\.i\.|artificial intelligence|machine learning|deep learning|ml|mlops|nlp|llm|genai|generative|data scien|data engineer|computer vision|cyber|cybers[ée]curit|security|s[ée]curit|infosec|soc|siem|pentest|penetration|forensic|cryptograph|malware|threat)\b/i;

/**
 * Business functions that are not this board, however the title is spelled.
 *
 * The first --write run added "Crypto Accounting Intern", "Crypto Operations
 * Intern" and "Crypto Partnership Intern" at Robinhood: three of fifteen rows,
 * a twenty per cent error rate, published with nobody reading them. "crypto"
 * was in the relevance list for cryptography and matched cryptocurrency, and
 * the roles themselves are accounting, operations and partnerships.
 *
 * Dropping the bare word fixes those three. This list is the backstop for the
 * next one, because a keyword that means two things in two industries is not a
 * mistake you make once.
 */
const WRONG_FUNCTION =
  /\b(accounting|accountant|finance|financial|audit|tax|payroll|procurement|operations analyst|partnership|partnerships|sales|account executive|marketing|communications|recruit|talent acquisition|human resources|legal|counsel|customer success|supply chain|logistics)\b/i;

/**
 * A doctoral POSITION, not a job that happens to require a doctorate.
 *
 * A bare "phd" is useless here: "Research Scientist (PhD)" is a staff job
 * where the doctorate is an entry requirement, and "PhD Research Intern" --
 * two of which are live on polled boards right now -- is a summer internship
 * for someone already doing one. Both would be wrong on a row labelled
 * "Doctorat". So the marker has to be followed by a word naming the position.
 */
export const IS_DOCTORAL_POSITION =
  /\b(?:phd|ph\.d\.?|doctoral)[\s-]+(?:position|student|candidate|researcher|research fellow|fellowship|vacancy|opportunit)|\b(?:doctorant|doctorante|doktorand(?:in)?|dphil|contrat doctoral|th[eè]se de doctorat)\b/i;

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

/**
 * Fetch the link a student would click, before any row claims it was checked.
 *
 * The four APIs prove the JOB is open, and that is the same evidence the Monday
 * check gathers for a Greenhouse or Workday row -- it asks those same endpoints.
 * What an API listing does not prove is that the href it handed us RESOLVES.
 *
 * And the row says "link checked <date>". The method note goes further and
 * promises the link is fetched and the page read rather than pinged for a status
 * code. On the Thursday a feed row was added, neither had happened: the board
 * had been checked, the link had not, and the first real fetch was the following
 * Monday. A student clicking into a 404 under a row dated today is precisely the
 * small untruth this page exists not to tell.
 *
 * So every candidate is fetched once before it is written. The cap means at most
 * fifteen requests a week, spread across employers by the per-company limit.
 */
/**
 * Boards that worked last run and do not work now.
 *
 * The finder polls 44 employer boards and prints a line each. A board that
 * breaks prints "unreachable -- HTTP 404" into a log nobody reads, the run
 * exits 0, and the finder goes quietly blind while still reporting success.
 * That is this project's recurring failure: the missing env block hid for a
 * week, the watchdog's red light hid a real break for three days. Attribution
 * without consequence is not a signal.
 *
 * Two shapes count, and the second is the one worth having:
 *
 *   - it errors now and did not before. Loud, easy.
 *   - it answers cleanly with ZERO jobs having answered with hundreds last
 *     week. No error at all. This is how an API that renamed a field dies:
 *     `Array.isArray(data.jobs)` still passes, the array is just empty now, and
 *     everything downstream looks like an employer who simply has no openings.
 *
 * Only boards that WERE working are compared. A board that has never answered
 * is a bad entry in the source list, not a regression, and flagging it every
 * Thursday is how a warning becomes something you learn to delete unread.
 *
 * A fall from 678 to 3 is deliberately not flagged. Hiring really does slow
 * down, and a threshold would make this a guess; zero is the one number that
 * cannot be explained away.
 */
export function sourceRegressions(previous = [], current = []) {
  const before = new Map(
    (Array.isArray(previous) ? previous : []).map((board) => [board.board, board])
  );
  const out = [];
  for (const now of Array.isArray(current) ? current : []) {
    const was = before.get(now.board);
    const wasScanned = Number(was?.scanned ?? 0);
    if (!was || wasScanned <= 0) continue;
    if (now.error) {
      out.push({ board: now.board, was: wasScanned, reason: `unreachable — ${now.error}` });
    } else if (Number(now.scanned ?? 0) === 0) {
      out.push({ board: now.board, was: wasScanned, reason: "answered with an empty board" });
    }
  }
  return out;
}

export function linkVerdict({ status, text, raw, href, finalUrl, now = Date.now() }) {
  // Refused is not gone. A listing we could not reach is one no row may claim we
  // read, so it is not added -- but it is not called dead either, and it goes to
  // the review file rather than the bin.
  if (BLOCKED_STATUSES.has(status)) return { ok: false, reason: `the employer refused us (HTTP ${status})` };
  if (!status) return { ok: false, reason: "the link could not be reached" };
  if (status >= 400) return { ok: false, reason: `the link answers HTTP ${status}` };
  const phrase = gonePhrase(text);
  if (phrase) return { ok: false, reason: `the page says "${phrase}"` };
  const expired = expiredValidThrough(raw, listingHost(href), now);
  if (expired) return { ok: false, reason: `the page gives a closing date of ${expired}` };
  if (redirectedAway(href, finalUrl)) return { ok: false, reason: "the link redirects away from the posting" };

  /**
   * A page with nothing on it has not been read, whatever its status code.
   *
   * Without this the gate was vacuous on half the configured sources. A Workday
   * requisition path that does not exist answers 200 with ZERO characters of
   * text, and an Ashby one answers 200 with "You need to enable JavaScript to
   * run this app." -- both of which this function called verified, so the row
   * shipped stamped "link checked today" having read nothing. Measured against
   * live tenants, not supposed.
   *
   * It matters here more than anywhere, because the finder BUILDS the Workday
   * href itself out of a tenant, a site slug and a path rather than using a URL
   * the API handed back. A wrong path is exactly what this fetch was added to
   * catch, and it was the one thing it could not see.
   *
   * check-stages.mjs has carried this rule for the same reason -- same 400
   * characters, comfortably below any real posting and well above a shell --
   * and its comment states the standard this file has to meet: the page tells
   * readers every link is opened and its page read, which cannot be true of a
   * page that has nothing to read. Without it the two scripts disagreed about
   * the same URL, the finder calling it verified on Thursday and the checker
   * calling it unverifiable on Monday.
   *
   * Workday and Ashby candidates therefore wait in the review file. That is a
   * real cost in volume and the right trade: the API proves the job is open,
   * which is worth a line in the review file, but it is not a person having
   * read the page, which is what the row would claim.
   */
  const visible = String(text).trim().length;
  if (visible < 400) {
    return {
      ok: false,
      reason: `the link answers HTTP ${status} with only ${visible} characters of text, so nothing was read`
    };
  }

  return { ok: true, reason: "" };
}

export async function verifyLink(href) {
  try {
    const res = await fetch(href, {
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(25_000)
    });
    const raw = await res.text();
    return linkVerdict({ status: res.status, text: visibleText(raw), raw, href, finalUrl: res.url });
  } catch {
    return { ok: false, reason: "the link could not be reached" };
  }
}

/** One second between fetches. Nobody is waiting on this run. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A board slug is not a company name, and consider() needs the map while the
 * file that holds it can only be read inside the guard below.
 *
 * So it is declared here and filled there. Block-scoping it next to the read
 * put it out of consider()'s reach, which makes every candidate a
 * ReferenceError -- caught by one unused-variable warning, which is the whole
 * reason that warning is not noise.
 */
let DISPLAY_NAMES = {};

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

/**
 * Two-letter tokens that are a US state AND a country on this board.
 *
 * CA is California and Canada. MA is Massachusetts and Morocco. DE is Delaware
 * and Germany, IN is Indiana and India, IL is Illinois and Israel.
 *
 * Computed rather than typed out, so the day a country joins COUNTRY_CODES its
 * collisions join this set without anyone having to remember.
 */
const AMBIGUOUS_CODES = new Set(
  [...US_STATES].filter((state) => Object.values(COUNTRY_CODES).includes(state))
);

/**
 * The same states written out, which the two-letter set never matches.
 *
 * Greenhouse writes "San Francisco, California" as readily as "San Francisco,
 * CA", and Ashby writes a bare "New York". Three good US internships --
 * Databricks, Together AI, Modal -- sat in the review file for a week because
 * of it, waiting on a person to type US. Nothing was wrong with them; the
 * finder simply had no rule for a spelled-out state.
 */
const US_STATE_NAMES = new Set([
  "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut",
  "delaware", "florida", "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa",
  "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts", "michigan",
  "minnesota", "mississippi", "missouri", "montana", "nebraska", "nevada", "ohio",
  "oklahoma", "oregon", "pennsylvania", "tennessee", "texas", "utah", "vermont",
  "virginia", "washington", "wisconsin", "wyoming", "new hampshire", "new jersey",
  "new mexico", "new york", "north carolina", "north dakota", "rhode island",
  "south carolina", "south dakota", "west virginia", "district of columbia"
]);

/**
 * Georgia is a US state and a country. It is not in COUNTRY_CODES today, so
 * nothing collides -- but computing the set means the day someone adds it, the
 * state name starts refusing to guess on its own, the way AMBIGUOUS_CODES
 * already does for the two-letter forms.
 */
const AMBIGUOUS_STATE_NAMES = new Set(
  [...US_STATE_NAMES].filter((name) => COUNTRY_CODES[name])
);

/**
 * Does anything in the whole location name a US state that can only be one?
 *
 * Used to settle the ambiguous cases. It reads the full string rather than the
 * parsed parts, because the parts stop at the first separator and the token
 * that settles it is often past that: "Boston, MA; Austin, TX" is settled by
 * TX, which `parts` never sees.
 */
const settlesAsUs = (location) =>
  String(location || "")
    .split(/[\u2022;,]/)
    .map((part) => part.trim())
    .some((part) => {
      const upper = part.toUpperCase();
      if (US_STATES.has(upper)) return !AMBIGUOUS_CODES.has(upper);
      const lower = part.toLowerCase();
      return US_STATE_NAMES.has(lower) && !AMBIGUOUS_STATE_NAMES.has(lower);
    });

export function splitLocation(location) {
  // Several locations in one string: take the first and let the reviewer see
  // the rest in the link. Greenhouse uses semicolons where Workday uses
  // bullets -- "New York, NY; San Francisco, CA" is two places, and reading it
  // as one left "NY; San Francisco" sitting in the city field.
  const first = String(location || "").split(/[\u2022;]/)[0];
  const parts = first.split(",").map((p) => p.trim()).filter(Boolean);
  if (!parts.length || /^\d+\s+locations?$/i.test(first.trim())) return { city: "", country: "" };

  /**
   * "Berlin, Berlin, de" is one city, not two.
   *
   * SmartRecruiters sends city and region as separate parts and for a
   * city-state they are the same word, so joining what is left after the
   * country gave a row whose city read "Berlin, Berlin". Collapsing repeats
   * keeps the employer's own words -- it just stops saying them twice.
   */
  const joinCity = (parts) => {
    const out = [];
    for (const part of parts) {
      if (!out.some((kept) => kept.toLowerCase() === part.toLowerCase())) out.push(part);
    }
    return out.join(", ");
  };

  const asCountry = (value) => {
    const v = value.toLowerCase();
    if (COUNTRY_CODES[v]) return COUNTRY_CODES[v];
    if (/^[a-z]{2}$/.test(v) && Object.values(COUNTRY_CODES).includes(v.toUpperCase())) {
      return v.toUpperCase();
    }
    return "";
  };

  const tail = parts[parts.length - 1];

  /**
   * Workday leads with the country: "US, CA, Santa Clara", "China, Shanghai".
   *
   * Guarded on the tail not being a place code itself, because
   * "Luxembourg, lu" -- a shape SmartRecruiters produces -- also has a
   * resolvable head, and this branch returns the LAST part as the city. It was
   * writing rows whose city read "lu". When both ends resolve, the tail is the
   * country and the head is the city, which is the ordinary way round.
   */
  const head = asCountry(parts[0]);
  if (head && parts.length > 1 && !asCountry(tail)) {
    return { city: parts[parts.length - 1], country: head };
  }

  /**
   * "New York, NY; San Francisco, CA" went onto the board as Canada, because
   * the country branch ran before the state branch and CA is both California
   * and Canada. A Boston internship would have been filed under Morocco, on
   * the Morocco page of a site written in Morocco, under the one filter
   * students actually use.
   *
   * But the first fix for that uppercased the tail before deciding, and case is
   * the whole signal. Greenhouse writes a US STATE in capitals -- "San
   * Francisco, CA". SmartRecruiters writes the COUNTRY in lower case --
   * "Casablanca, ma", "Munich, de", "Toronto, ca". Uppercasing threw that away
   * and sent every one of them to the review file unplaced, including a
   * Moroccan cybersecurity internship, which is the single most on-target
   * listing this board can hold. Ten German Bosch postings too.
   *
   * So only an UPPER-case two-letter token is ambiguous. A lower-case one is
   * the country, said plainly by the source that wrote it.
   *
   * For the genuinely ambiguous ones, an unambiguous state anywhere in the
   * WHOLE location settles it -- NY can only be New York -- and the scan uses
   * the full string rather than `parts`, because `parts` stops at the first
   * separator and so could never see the part that settles it. With nothing to
   * settle it the country is left blank and a person places it, which is what
   * refusing to guess means.
   */
  const upperTwoLetter = /^[A-Z]{2}$/.test(tail);
  if (upperTwoLetter && AMBIGUOUS_CODES.has(tail) && parts.length > 1) {
    return { city: joinCity(parts.slice(0, -1)), country: settlesAsUs(location) ? "US" : "" };
  }

  /**
   * The state spelled out: "San Francisco, California", or a bare "New York".
   *
   * This runs before the country branch below on purpose. The two sets do not
   * overlap today, but if a country whose name is also a state's is ever added
   * to COUNTRY_CODES, asCountry would answer first and quietly file an Atlanta
   * listing under that country -- so the ambiguous ones are made to refuse
   * here, before anything can guess.
   *
   * A lone state name keeps itself as the city, because that is what the
   * employer wrote: Ashby's "New York" means the city, and replacing it with
   * an empty string to look tidy would lose the only location there is.
   */
  const tailLower = tail.toLowerCase();
  if (US_STATE_NAMES.has(tailLower)) {
    const city = joinCity(parts.slice(0, -1)) || tail;
    if (!AMBIGUOUS_STATE_NAMES.has(tailLower)) return { city, country: "US" };
    return { city, country: settlesAsUs(location) ? "US" : "" };
  }

  const tailCountry = asCountry(tail);
  if (tailCountry) {
    return { city: joinCity(parts.slice(0, -1)), country: tailCountry };
  }
  // A US state abbreviation names the country without naming it.
  if (US_STATES.has(tail.toUpperCase()) && parts.length > 1) {
    return { city: joinCity(parts.slice(0, -1)), country: "US" };
  }
  return { city: joinCity(parts), country: "" };
}

function consider({ company, role, location, href, source }) {
  if (!role || !href) return;
  if (!IS_STUDENT_POSITION(role)) return;
  if (!IS_RELEVANT.test(role)) return;
  if (WRONG_FUNCTION.test(role)) return;
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

/**
 * A company name is not a board name. Greenhouse took "scaleai" and "dataiku"
 * but refused "snyk" and "wandb"; Ashby took "elevenlabs" and "synthesia" and
 * refused "huggingface". There is no rule, so each name is tried in a few
 * plausible spellings and whatever answers is the truth.
 */
function slugVariants(name) {
  const base = String(name).toLowerCase().replace(/[^a-z0-9]/g, "");
  const dashed = String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return [...new Set([base, dashed, `${base}ai`, `${dashed}-ai`, base.replace(/ai$/, "")])].filter(Boolean);
}

async function discoverBoards(sources) {
  const prospects = sources.prospects ?? [];
  const known = new Set([
    ...(sources.greenhouse ?? []),
    ...(sources.ashby ?? []),
    ...(sources.smartrecruiters ?? [])
  ].map((b) => String(b).toLowerCase()));

  const found = { greenhouse: [], ashby: [], smartrecruiters: [] };
  for (const name of prospects) {
    for (const slug of slugVariants(name)) {
      if (known.has(slug.toLowerCase())) break;

      const gh = await getJson(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
      if (Array.isArray(gh.data?.jobs) && gh.data.jobs.length) {
        found.greenhouse.push(slug); known.add(slug.toLowerCase());
        console.log(`  + greenhouse      ${slug} (${gh.data.jobs.length} postings)`);
        break;
      }
      const ash = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${slug}`);
      if (Array.isArray(ash.data?.jobs) && ash.data.jobs.length) {
        found.ashby.push(slug); known.add(slug.toLowerCase());
        console.log(`  + ashby           ${slug} (${ash.data.jobs.length} postings)`);
        break;
      }
      const sr = await getJson(`https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=1`);
      if (Array.isArray(sr.data?.content) && sr.data.totalFound) {
        found.smartrecruiters.push(slug); known.add(slug.toLowerCase());
        console.log(`  + smartrecruiters ${slug} (${sr.data.totalFound} postings)`);
        break;
      }
    }
  }
  return found;
}

/**
 * Only sweep when run as a command.
 *
 * Importing this file -- which the test of linkVerdict below does -- must not
 * fire thirty requests at four employers' APIs and rewrite the review file. It
 * did exactly that the first time a test imported it, which is the same trap
 * check-stages.mjs carries this same guard for.
 */
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {

  const sources = JSON.parse(await fs.readFile(SOURCES, "utf8"));

  if (DISCOVER) {
    console.log(`\n  Probing ${sources.prospects?.length ?? 0} companies for a job board.\n`);
    const found = await discoverBoards(sources);
    const added = found.greenhouse.length + found.ashby.length + found.smartrecruiters.length;
    if (added) {
      for (const key of ["greenhouse", "ashby", "smartrecruiters"]) {
        sources[key] = [...new Set([...(sources[key] ?? []), ...found[key]])].sort();
        for (const slug of found[key]) {
          // A slug is not a company name, and the board is where that shows.
          // A generated name is a placeholder, not an answer: this turns
          // "figureai" into "Figure AI" rather than "Figureai", and the board
          // still reads better when a person corrects it in the config.
          sources.displayNames[slug] ??= slug
            .replace(/-/g, " ")
            .replace(/ai$/, " AI")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b([a-z])/g, (m) => m.toUpperCase())
            .replace(/\bAi\b/g, "AI");
        }
      }
      await fs.writeFile(SOURCES, `${JSON.stringify(sources, null, 2)}\n`);
    }
    console.log(`\n  ${added} new board${added === 1 ? "" : "s"} added to stage-sources.json\n`);
  }
  DISPLAY_NAMES = sources.displayNames ?? {};
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
  /**
   * Compared without the query string, because Greenhouse serves the same job at
   * both /jobs/7989895003 and /jobs/7989895003?gh_jid=7989895003 and the API
   * returns the second. Matching the raw string let one posting onto the board
   * twice under two different ids — the same Celonis role in Madrid, listed
   * twice, which is exactly the sloppiness a reader notices first.
   */
  const bareUrl = (href) => String(href).split(/[?#]/)[0];
  const seenHref = new Set(stages.items.map((i) => bareUrl(i.href)));
  const seenPair = new Set(stages.items.map((i) => `${i.company}|${i.role}`.toLowerCase()));
  const fresh = candidates.filter(
    (c) => !seenHref.has(bareUrl(c.href)) && !seenPair.has(`${c.company}|${c.role}`.toLowerCase())
  );

  const unique = [];
  const seenNew = new Set();
  for (const c of fresh) {
    if (seenNew.has(bareUrl(c.href))) continue;
    seenNew.add(bareUrl(c.href));
    unique.push(c);
  }
  const picked = unique.slice(0, LIMIT);

  const today = new Date().toISOString().slice(0, 10);

  /** The same shape add-stage.mjs writes, so both paths produce one kind of row. */
  function slugify(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function toStage(c) {
    /*
     * A doctoral marker only means "doctorat" when no internship word is
     * present.
     *
     * "PhD Research Intern" and "PhD GenAI Research Scientist Intern" are both
     * real titles on polled boards, and both are summer internships FOR someone
     * already doing a doctorate -- not a funded thesis. Measured on 25 October:
     * those two were the entire doctoral-looking yield of 38 Greenhouse and
     * Ashby boards, and neither is a doctorate. Classifying them as one would
     * put an internship on a board row reading "Doctorat".
     *
     * "Master thesis" stays pfe, which is what it is.
     */
    const doctoral = IS_DOCTORAL_POSITION.test(c.role);
    const internshipWord = /\b(intern|internship|stage|stagiaire|praktikum|co-?op|placement|trainee)\b/i.test(c.role);
    const kind = /\b(alternan|apprenti|apprenticeship|working student|werkstudent)\b/i.test(c.role)
      ? "alternance"
      : doctoral && !internshipWord
        ? "doctorat"
        : /\b(pfe|thesis|fin d'?[ée]tudes)\b/i.test(c.role)
          ? "pfe"
          : "stage";
    return {
      id: `${slugify(c.company)}-${slugify(c.role)}-${slugify(c.city || c.country || "remote")}-rolling`,
      role: c.role,
      company: c.company,
      ...(c.city ? { city: c.city } : {}),
      country: c.country,
      kind,
      href: c.href,
      source: `${c.company} careers`,
      postedAt: today,
      checkedAt: today,
      addedBy: "feed"
    };
  }

  const shellQuote = (v) => `'${String(v).replace(/'/g, "'\\''")}'`;

  /**
   * Built after the write pass, never before it.
   *
   * The verdict from verifying a link is the most useful thing this file can tell
   * a person, and the two kinds of failure deserve different attention: a
   * candidate skipped because the employer refused us is worth opening by hand, a
   * candidate skipped because its own page says the role is filled is worth
   * nothing. Building this list first meant every row read the same.
   */
  function buildMarkdown() {
    const lines = [
      `# Internship candidates — ${today}`,
      "",
      `${picked.length} posting${picked.length === 1 ? "" : "s"} that match internship + AI/cyber and are not on the board yet.`,
      "",
      "Each link was fetched once before anything was written, so a candidate whose",
      "link does not resolve is marked here rather than offered. What no fetch can",
      "settle is whether the role is what its title says — that is the judgement",
      "these are waiting for, and it is why the board is worth reading.",
      "",
      "Copy the command under any posting you want to keep.",
      ""
    ];

    for (const c of picked) {
      lines.push(`### ${c.role}`);
      lines.push(`${c.company} · ${c.location || "location not stated"} · via ${c.source}`);
      lines.push("");
      if (c.addedToBoard) {
        lines.push("_Added to the board by this run: its link was fetched and answered._");
        lines.push("");
      } else if (c.notVerified) {
        lines.push(`_Not added — ${c.notVerified}._`);
        lines.push("");
      }
      lines.push(`<${c.href}>`);
      lines.push("");
      lines.push("```");
      lines.push(
        `npm run add:stage -- --role ${shellQuote(c.role)} --company ${shellQuote(c.company)} ` +
          // A visible placeholder, not an omission. An omitted --country used to be
          // silently defaulted to MA by add-stage.mjs; it is refused now, and
          // printing FILL-ME names the word to replace rather than leaving the
          // reviewer to diff two commands to find what is missing.
          `--city ${shellQuote(c.city)} --country ${c.country || "FILL-ME"} ` +
          `--deadline rolling --link ${shellQuote(c.href)}`
      );
      lines.push("```");
      lines.push("");
    }

    if (!picked.length) {
      lines.push("_Nothing new this run. Every matching posting on these boards is already listed._");
      lines.push("");
    }
    return lines;
  }

  /**
   * Written only with --write, and only for candidates whose country resolved.
   *
   * A listing with no country lands under whatever the filter defaults to on a
   * board where country is the control students actually use, so those stay in
   * the review file for a person to place. Refusing to guess is the whole
   * difference between this and a scraper.
   */
  let written = 0;
  if (WRITE) {
    /*
     * A doctoral candidate never auto-adds. It goes to the review file.
     *
     * The first run of the widened gate returned "PhD Researcher, AI Research"
     * at Autodesk, and I cannot tell from the title whether that is a funded
     * thesis or a staff research role that requires a doctorate. Only the page
     * says, and a row labelled "Doctorat" that is actually a staff job is
     * exactly the kind of small untruth this board is built not to tell.
     *
     * Internships do not need this because "Intern" in a title means the thing
     * it says. "PhD" does not: it is the position in "PhD Student" and a
     * requirement in "Research Scientist (PhD)", and the honest ones in between
     * need somebody to read the posting.
     *
     * Same shape as the Workday and Ashby candidates, which also wait because a
     * fetch cannot settle what they are.
     */
    const placeable = picked.filter(
      (c) => c.country && SERVED_COUNTRIES.has(c.country) && !IS_DOCTORAL_POSITION.test(c.role)
    );
    // Seeded with what each employer already holds, so the ceiling counts the
    // board and not just this run.
    const perCompany = new Map();
    for (const item of stages.items) {
      perCompany.set(item.company, (perCompany.get(item.company) ?? 0) + 1);
    }
    const addedThisRun = new Map();
    const spread = placeable.filter((c) => {
      const onBoard = perCompany.get(c.company) ?? 0;
      const thisRun = addedThisRun.get(c.company) ?? 0;
      if (onBoard >= MAX_PER_COMPANY_ON_BOARD) return false;
      if (thisRun >= PER_COMPANY_CAP) return false;
      perCompany.set(c.company, onBoard + 1);
      addedThisRun.set(c.company, thisRun + 1);
      return true;
    });
    // Fetched one at a time, and only until the cap is full: a run that needs
    // fifteen rows makes fifteen requests, not one for every candidate found.
    const toAdd = [];
    const unverified = [];
    for (const c of spread) {
      if (toAdd.length >= WRITE_CAP) break;
      const verdict = await verifyLink(c.href);
      if (verdict.ok) {
        c.addedToBoard = true;
        toAdd.push(c);
      } else {
        c.notVerified = verdict.reason;
        unverified.push(c);
        console.log(`  SKIP  ${c.company} — ${c.role}: ${verdict.reason}`);
      }
      await sleep(1_000);
    }
    const existingIds = new Set(stages.items.map((i) => i.id));
    const rows = toAdd.map(toStage).filter((row) => !existingIds.has(row.id));
    if (rows.length) {
      stages.items.push(...rows);
      stages.updatedAt = new Date().toISOString();
      await fs.writeFile(STAGES, `${JSON.stringify(stages, null, 2)}\n`);
      written = rows.length;
    }
    console.log(
      `\n  --write: added ${written} of ${spread.length} after spreading (cap ${WRITE_CAP}, ` +
        `${PER_COMPANY_CAP} per employer); ` +
        `${unverified.length} did not survive having their link fetched; ` +
        `${picked.length - placeable.length} had no country and stay in the review file`
    );
  }

  // Read last run's report BEFORE overwriting it: the committed file is the only
  // record of which boards were working a week ago.
  let previousBoards = [];
  try {
    previousBoards = JSON.parse(await fs.readFile(OUT_JSON, "utf8")).boards ?? [];
  } catch {
    // First run, or a malformed file. Nothing to compare against is not a fault.
  }
  const degraded = sourceRegressions(previousBoards, sourceReport);

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_MD, `${buildMarkdown().join("\n")}\n`);
  await fs.writeFile(
    OUT_JSON,
    `${JSON.stringify(
      { generatedAt: today, boards: sourceReport, degradedSources: degraded, candidates: picked },
      null,
      2
    )}\n`
  );

  /*
   * One marker the workflow greps, and a step summary that shows up on a GREEN
   * run -- which is the only kind of run this will happen on, since a broken
   * board does not stop the finder from doing everything else correctly.
   */
  if (degraded.length) {
    console.log(`\n  SOURCES DEGRADED — ${degraded.length} board(s) worked last run and do not now:`);
    for (const d of degraded) console.log(`    ${d.board}: scanned ${d.was} last run, ${d.reason}`);
    if (process.env.GITHUB_STEP_SUMMARY) {
      const lines = [
        "### Employer boards that stopped answering",
        "",
        "These worked on the previous run. A board that answers with an empty list",
        "rather than an error is usually a renamed field, not an employer with no jobs.",
        "",
        ...degraded.map((d) => `- **${d.board}** — scanned ${d.was} last run, ${d.reason}`),
        ""
      ].join("\n");
      try {
        await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines}\n`, "utf8");
      } catch {}
    }
  }

  console.log(`\n  ${candidates.length} matched · ${unique.length} not already listed · ${picked.length} written`);
  console.log(`  ${path.relative(ROOT, OUT_MD)}`);
  console.log(`\n  Links already fetched. Read the pages, then paste the command under the ones worth keeping.\n`);

}
