# AI & Cybersecurity News — Engineering Case Study

A production-grade, bilingual (EN/FR) content platform built on **Next.js 14**, with a
custom **multi-agent content-automation pipeline** and a hardened security layer.

Built solo as a final-year AI student. This document is the engineering tour — for
setup and operations, see [README.md](README.md).

> **Live:** https://ai-student-hub-navy.vercel.app · **Stack:** Next.js 14 (App Router) · TypeScript (strict) · Tailwind · Node ESM tooling · Vitest · GitHub Actions

---

## What it is (in one paragraph)

A bilingual editorial site for AI/CS students, plus an autonomous back office that
discovers news from 40+ first-party sources, audits editorial balance and quality,
drafts articles with an LLM, and routes work to GitHub — all behind a security layer
(nonce CSP, distributed rate limiting, session revocation, SSRF/CSRF guards) that most
content sites never build.

---

## Architecture at a glance

```
┌────────────────────────── Next.js 14 App Router ──────────────────────────┐
│  /[lang]/…  localized pages (EN/FR)      /api/…  route handlers            │
│  ISR + static generation (263 pages)     auth · newsletter · track         │
│  middleware.ts → per-request nonce CSP                                      │
└───────────────┬───────────────────────────────────────┬───────────────────┘
                │ reads                                   │ writes/guards
        ┌───────▼────────┐                        ┌───────▼────────┐
        │ content model  │                        │  lib/ (core)   │
        │ posts · news · │                        │ auth-session   │
        │ auto-news/tools│                        │ rate-limit     │
        └───────▲────────┘                        │ security(SSRF) │
                │ generated                        │ oauth · seo    │
        ┌───────┴───────────────────────────┐     └────────────────┘
        │   Autonomous "BlogOps" pipeline    │
        │  (scripts/*.mjs, GitHub Actions)   │
        │                                    │
        │  aggregate → audit → LLM draft →   │
        │  quality-gate → GitHub issues/PR   │
        └────────────────────────────────────┘
```

---

## The interesting engineering

### 1. Autonomous multi-agent content pipeline (the standout)
A set of deterministic Node agents orchestrated in sequence, each with structured
JSON state and a markdown report:
- **Aggregators** pull from 40+ trusted first-party feeds/pages, dedupe, age-trim,
  and reject low-trust sources (arXiv, social) — with a `curl --fail` fallback when
  `fetch` is blocked.
- **Operator agent** audits AI-vs-CS editorial balance, citation coverage, and
  conversion instrumentation, then emits a prioritized action queue.
- **Design agent** scores the UI against a weighted rubric.
- **Issue sync** turns the queues into GitHub Issues, deduped by a stable content hash.
- **Autopilot** runs the whole pipeline behind quality gates (lint → build → verify)
  and commits/pushes only when they pass, with rollback on failure.

### 2. LLM integration done safely
A Claude-powered writer (`claude-opus-4-8`, structured output) drafts full **EN/FR**
articles from the operator's ranked opportunities. Design constraints that matter:
- **Never auto-publishes** — output is review-gated and surfaced as a **pull request**.
- **Fails open, not closed** — skips gracefully without an API key so the pipeline
  never breaks because a secret is missing.
- Model is constrained to cite only provided sources (no invented URLs).

### 3. Security layer beyond the norm for a blog
- **Nonce-based CSP** generated per request in `middleware.ts`, plus a full header set
  (HSTS, COOP/CORP, frame/mime/referrer policies).
- **Distributed rate limiting** (Upstash Redis) with an in-memory fallback, and
  **progressive login lockout**.
- **Session revocation** denylist on logout; HMAC-signed session cookies.
- **SSRF guard** on outbound webhooks (incl. IPv4-mapped & bracketed IPv6 edge cases),
  **CSRF** origin/referer checks, honeypots, and optional Turnstile.

### 4. Internationalization & SEO
Full EN/FR parity via a dictionary system; canonical + hreflang alternates, JSON-LD,
sitemap, RSS, and per-route metadata.

### 5. Reliability
Vitest unit tests over the security-sensitive lib layer (URL safety, the SSRF guard,
client-IP parsing, the tracking allowlist) and a CI workflow running
lint → typecheck → test → build on every push/PR.

---

## Key decisions & trade-offs

| Decision | Why | Trade-off |
| --- | --- | --- |
| Deterministic agents (not one big LLM loop) | Reproducible, debuggable, cheap; LLM used only where prose is needed | More code than a single prompt |
| Minimal dependencies (Next/React + one SDK) | Smaller attack/maintenance surface, fast installs | Some wheels reinvented (rate limit, sanitizers) |
| Content as typed modules, not a CMS | Type safety, zero infra, git-reviewable | Doesn't scale to many non-technical authors → **next step: MDX/CMS** |
| PR-gated LLM output | Human stays in the loop; AI content is never published blind | Slower than full autopilot |

---

## What I'd do differently (and why that matters)

Honest senior-signal section, because judgment is the skill:

- **It's over-built for its stage.** The auth/account system and the autopilot are
  impressive but premature for a pre-audience site. I'd cut auth entirely (a blog
  doesn't need logins) to shrink the security/maintenance surface.
- **Auto-aggregated content is an SEO and quality risk.** The right move is fewer,
  original, genuinely useful articles — the LLM as a drafting *assistant*, not an author.
- **Content belongs in MDX or a CMS,** not TypeScript object literals — that's the one
  refactor that unlocks scalable publishing for both humans and the writer agent.

The point of this project was to prove I can design and ship a non-trivial system. The
lesson I took from it is the harder one: knowing what *not* to build.

---

## Skills demonstrated

`Next.js 14 App Router` · `TypeScript (strict)` · `web security (CSP, CSRF, SSRF, rate limiting, session mgmt)` ·
`OAuth 2.0` · `LLM/Claude API + structured output` · `multi-agent orchestration` ·
`i18n` · `technical SEO` · `unit testing (Vitest)` · `CI/CD (GitHub Actions)` · `ESM tooling`

---

## How to talk about it in an interview (60-second version)

> "I built a bilingual content platform on Next.js, but the interesting part is the
> back office: an autonomous pipeline that ingests AI/CS news from 40+ first-party
> sources, audits editorial balance and citation coverage, drafts articles with the
> Claude API, and opens pull requests — all behind quality gates so nothing ships
> unreviewed. I also hardened it well past a typical blog: nonce-based CSP, distributed
> rate limiting with a fallback, session revocation, and SSRF/CSRF guards — and I added
> Vitest + CI, which actually caught a real IPv6 SSRF bug. If I rebuilt it, I'd cut the
> auth system and move content to MDX — I over-engineered for the stage, and knowing
> that is the part I'm most proud of."
