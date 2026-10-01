# AI and Cybersecurity News

81 AI and cybersecurity internships in France and Morocco, every link verified
weekly by a checker that reads the page body — because three postings answered
HTTP 200 while saying, in the body, that they had closed.

Around that: a bilingual (EN/FR) publication for people learning and building in
AI and cybersecurity, with an autonomous back office that runs it.

**[Live site](https://ai-student-hub-navy.vercel.app)** ·
**[Engineering case study](PORTFOLIO.md)** ·
**[Operations manual](docs/OPERATIONS.md)**

---

## What's actually interesting here

**A verifier for someone else's data.** `scripts/check-stages.mjs` opens all 81
internship listings weekly and reads each page, because a status code does not
tell you a job has closed: three separate wordings — "no longer available",
"n'est plus disponible", "a expiré" — were each invisible to HTTP status,
redirects and schema.org `validThrough` alike. A 403 is treated as a fact about
us, not about the job, and nothing is ever deleted without a person confirming
it. The day it was first wired to a schedule it found a dead listing sitting at
the top of the page.

**An autonomous content pipeline.** Six deterministic Node agents ingest from 21
first-party sources — official engineering blogs only, never aggregators or
preprints — then audit editorial balance, draft with the Claude API, and open
pull requests. Nothing publishes without review.

**A security layer well past what a blog needs.** Per-request nonce CSP, session
revocation, SSRF/CSRF guards, and rate limiting that prefers a shared Redis store
and falls back to memory — which, with no Redis configured, is what actually runs,
so the limits are per instance. 314 tests across 32 files, because that's where
the bugs hide.

**A watchdog that heals the site while nobody is watching.** It checks the live
site, content freshness, lockfile integrity and vulnerabilities daily; repairs
dependency drift on its own — but only after lint, typecheck, tests and build all
pass on the repaired tree; and reports through a single GitHub issue it opens and
closes itself.

That last one exists because this project spent **80 days silently broken**, and
finding out why is the most useful engineering I did on it. That story is the
[case study](PORTFOLIO.md).

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind ·
Node ESM tooling · Vitest · GitHub Actions · Vercel

## Run it

```bash
npm ci
cp .env.example .env.local   # fill in what you need; it runs without most of it
npm run dev                  # http://localhost:3000
```

## Check it

```bash
npm run lint && npm run typecheck && npm test && npm run build
npm run watchdog             # live site, freshness, lockfile, advisories, config
```

---

Everything else — environment variables, deployment, the agent schedule, the
editorial policy and the content workflow — is in the
**[operations manual](docs/OPERATIONS.md)**.

---

© 2026 Baounna Mohamed. All rights reserved.

This repository is public so the work can be read and reviewed. It is **not**
open source — no licence is granted to copy, modify, redistribute or deploy it.
If you would like to use something here, please ask.
