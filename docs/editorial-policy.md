# AI and Cybersecurity News Editorial Policy (AI + Computer Science)

This policy defines how AI and Cybersecurity News publishes content for anyone who wants accurate AI + computer science updates and practical tools.

- Primary audience: anyone who builds, learns, or works with AI and computer science.
- Important sub-audience: students who need roadmap, career, and budget-friendly guidance.

## 1) Coverage Balance

- AI and computer science are both first-class editorial tracks.
- New publishing should maintain practical balance across:
  - AI Fundamentals
  - ML Engineering
  - LLM Systems
  - CS Fundamentals
  - Systems & Backend
  - Cloud/DevOps
  - Security & Performance
  - Career/Interviews
- News and blog navigation must keep visible AI/CS split entry points.

## 2) Source Integrity

- Do not publish uncited claims.
- Every news brief must include a direct source link.
- Long-form posts must include credible references (official docs, standards, research, or trusted technical publishers).
- Auto-news feeds must prioritize official engineering/vendor blogs and documentation portals (not raw arXiv feed ingestion).
- Auto-tools feeds must prioritize official release/changelog channels and first-party product announcements.
- Do not fabricate data, benchmarks, citations, or release claims.

### Allowed source classes

- Official company engineering blogs/newsrooms/docs.
- Standards and public institutions (for example NIST, W3C).
- Official project foundations/repositories release channels.
- Peer-reviewed venues only when citation context is explicit and verifiable.

### Blocked source patterns for auto-ingestion

- Raw arXiv feed ingestion as a primary source stream.
- Unverified aggregators that do not link to first-party source pages.
- Anonymous content mirrors with no publisher accountability.

### Enforcement notes

- Auto-news pipeline drops blocked source patterns and non-first-party links.
- Auto-tools pipeline drops blocked source patterns and non-first-party links.
- Public UI must label source name + source link on each news item.

## 3) Audience-First Writing Standard

- Explain "why this matters in practice" with a clear action path.
- Include a student-focused note when relevant, without making student context mandatory.
- Include execution steps (what to do next in project workflow).
- Keep advice budget-aware and deployment-aware.
- Prefer measurable guidance over vague theory.

## 4) AI/CS Linking Policy

- Internal linking should bridge clusters:
  - news -> blog
  - blog -> resources / compare / product
  - AI pages -> related CS pages
  - CS pages -> related AI pages
- Category and tag pages should support cross-track discovery.

## 5) Monetization Ethics

- Affiliate links must be relevant to real user outcomes.
- Disclosures must be visible where affiliate links appear.
- Never hide affiliate intent behind misleading copy.
- Product CTAs should be clear, optional, and non-deceptive.

## 6) Localization Quality (EN/FR)

- Important updates should preserve EN/FR parity.
- If full translation is not available yet, content must remain translation-ready and structurally aligned.
- Localized metadata and hreflang must stay valid.

## 7) Privacy, Compliance, and Trust

- Keep legal pages available and up to date (privacy, terms, affiliate disclosure).
- Do not expose private strategy text or internal planning language on public pages.
- Keep public stats/testimonials real or clearly generic without false claims.

## 8) Quality Gate Before Publish

Run:

```bash
npm run lint
npm run build
npm run verify:production
npm run verify:affiliates
npm run verify:public-content
```

Publish only after checks pass for the target environment.
