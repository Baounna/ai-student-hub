import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
// @ts-expect-error - plain .mjs script, no types
import { MAX_DRAFT_AGE_DAYS, MIN_DAYS_BETWEEN_ISSUES, sendGuards } from "../scripts/send-issue.mjs";

/**
 * The only irreversible thing in this repository.
 *
 * Everything else here can be undone with git. An email cannot, and it goes to
 * students who handed over an address expecting verified listings. So the
 * guards are a pure function: the one thing that cannot be tested by running
 * it is the thing most worth testing, and "it refused when I tried it" is not
 * evidence that it refuses the case nobody tried.
 *
 * Each refusal has to name what a person would do about it. "Cannot send" with
 * no reason is an instruction to go around the check.
 */
const NOW = Date.parse("2026-11-08T12:00:00Z");
const base = {
  draft: { draftedAt: "2026-11-08", subject: "12 internships closing soonest", ids: ["a", "b"], slugs: [] },
  boardIds: ["a", "b", "c"],
  expiredIds: [] as string[],
  lastSentAt: null as string | null,
  nowMs: NOW,
  hasKey: true
};

describe("sendGuards", () => {
  it("allows a fresh draft whose listings are all still open", () => {
    const v = sendGuards(base);
    expect(v.ok).toBe(true);
    expect(v.why).toContain("2 listing(s)");
  });

  it("refuses without a v4 key, and says which key", () => {
    // CONVERTKIT_API_KEY is a v3 key for the subscribe form and will not work
    // on the broadcasts endpoint; confusing the two is the obvious mistake.
    const v = sendGuards({ ...base, hasKey: false });
    expect(v.ok).toBe(false);
    expect(v.why).toContain("v4");
    expect(v.why).toContain("CONVERTKIT_API_KEY");
  });

  it("refuses a draft old enough for the board to have moved", () => {
    const v = sendGuards({ ...base, draft: { ...base.draft, draftedAt: "2026-10-06" } });
    expect(v.ok).toBe(false);
    expect(v.why).toContain("days old");
    expect(v.why).toContain("draft:issue");
    expect(MAX_DRAFT_AGE_DAYS).toBeLessThanOrEqual(7);
  });

  it("refuses when a listing has vanished from the board", () => {
    // The exact failure the October draft would have shipped: five of its
    // twelve listings had closed and left the board while it waited.
    const v = sendGuards({ ...base, boardIds: ["a"] });
    expect(v.ok).toBe(false);
    expect(v.why).toContain("no longer on the board");
    expect(v.why).toContain("b");
  });

  it("refuses when a listing has closed but is still shown", () => {
    const v = sendGuards({ ...base, expiredIds: ["b"] });
    expect(v.ok).toBe(false);
    expect(v.why).toContain("closed");
  });

  it("refuses to send twice in a week", () => {
    const v = sendGuards({ ...base, lastSentAt: "2026-11-06" });
    expect(v.ok).toBe(false);
    expect(v.why).toContain("at most one a week");
    expect(MIN_DAYS_BETWEEN_ISSUES).toBeGreaterThanOrEqual(5);
  });

  it("allows the next issue once the promised week has passed", () => {
    expect(sendGuards({ ...base, lastSentAt: "2026-10-30" }).ok).toBe(true);
  });

  it("refuses a draft with no subject rather than inventing one", () => {
    // Two implementations of "what is this issue called" drift: the one in the
    // email and the one in the ledger.
    const v = sendGuards({ ...base, draft: { ...base.draft, subject: "" } });
    expect(v.ok).toBe(false);
    expect(v.why).toContain("no subject");
  });

  it("refuses when there is nothing waiting", () => {
    const v = sendGuards({ ...base, draft: null });
    expect(v.ok).toBe(false);
    expect(v.why).toContain("draft:issue");
  });
});

describe("the sender itself", () => {
  const SCRIPT = readFileSync("scripts/send-issue.mjs", "utf8");

  it("does nothing unless told to send", () => {
    expect(SCRIPT).toMatch(/const DO_SEND = argv\.includes\("--send"\)/);
    expect(SCRIPT).toMatch(/Dry run\. Nothing was sent\./);
  });

  it("writes the ledger only after Kit has accepted the broadcast", () => {
    // The reverse order is how three September drafts retired their listings
    // without an email going out.
    const accepted = SCRIPT.indexOf("if (!response.ok)");
    const ledger = SCRIPT.indexOf("await fs.writeFile(\n    STATE");
    expect(accepted).toBeGreaterThan(-1);
    expect(ledger).toBeGreaterThan(accepted);
  });

  it("uses the v4 endpoint and header, and schedules rather than guessing a send flag", () => {
    expect(SCRIPT).toContain("https://api.kit.com/v4/broadcasts");
    expect(SCRIPT).toMatch(/"X-Kit-Api-Key"/);
    // Kit has no "send now": a timestamp schedules, null saves a draft.
    expect(SCRIPT).toMatch(/send_at: sendAt/);
  });

  it("refuses to guess which draft when two are waiting", () => {
    expect(SCRIPT).toMatch(/drafts are waiting\. Name one/);
  });
});

/**
 * The ledger has to survive a fresh checkout.
 *
 * `/drafts/` was ignored in full, so every CI run began with no record of what
 * had been sent. The "no issue in the last five days" guard could never fire
 * there, and `draft:issue` — which computes "new since the last issue" from
 * that same file — would have re-offered the identical twelve listings the
 * following Monday.
 *
 * The first real send, on 8 November 2026, went out correctly and then logged
 * "Ledger unchanged" and committed nothing. The send worked; the memory of it
 * did not. That is the shape of every bug this project keeps finding: the
 * loud half succeeds and the quiet half is never checked.
 */
describe("the sent ledger", () => {
  it("is tracked by git, not ignored with the drafts", () => {
    // git ls-files is the only honest test of this. The file existing on a
    // developer's disk proves nothing about a fresh checkout — which is
    // exactly the assumption that produced the bug.
    const tracked = execFileSync("git", ["ls-files", "drafts/.last-issue.json"], { encoding: "utf8" }).trim();
    expect(tracked).toBe("drafts/.last-issue.json");
  });

  it("keeps the drafts themselves out of the repository", () => {
    // The negation must re-include one file, not undo the whole rule.
    const tracked = execFileSync("git", ["ls-files", "drafts/"], { encoding: "utf8" }).trim().split("\n");
    expect(tracked).toEqual(["drafts/.last-issue.json"]);
  });

  it("is written as /drafts/* so the negation can work at all", () => {
    // git cannot re-include a file whose parent directory is excluded, so
    // "/drafts/" would make the "!" line below it meaningless.
    const ignore = readFileSync(".gitignore", "utf8");
    expect(ignore).toMatch(/^\/drafts\/\*$/m);
    expect(ignore).toMatch(/^!\/drafts\/\.last-issue\.json$/m);
    expect(ignore).not.toMatch(/^\/drafts\/$/m);
  });

  it("makes the workflow fail when a send records nothing", () => {
    // "Ledger unchanged" after a send is not an absence of news; it is the
    // send having been forgotten.
    const workflow = readFileSync(".github/workflows/send-issue.yml", "utf8");
    expect(workflow).toMatch(/git diff --quiet -- drafts\/\.last-issue\.json/);
    expect(workflow).toMatch(/after a send is a fault/);
    expect(workflow).toMatch(/exit 1/);
  });
});
